const path          = require('path');
const express       = require('express');
const morgan        = require('morgan');
const helmet        = require('helmet');
const yup           = require('yup');
const monk          = require('monk');
const rateLimit     = require('express-rate-limit');
const slowDown      = require('express-slow-down');
const { nanoid }    = require('nanoid');
const newrelic      = require('newrelic');
// const { I18n }      = require('i18n');
// // const expressLayouts = require('express-ejs-layouts')

require('dotenv').config();

const db = monk(process.env.MONGODB_URI);
const urls = db.get('urls');
const clique = db.get('clique');

urls.createIndex({ slug: 1 }, { unique: true });
clique.createIndex({ slug: 1 }, { unique: false });

const app = express();
app.enable('trust proxy');

app.use(helmet());
app.use(morgan('common'));
app.use(express.json());
app.use(express.static('./public'));

const notFoundPath = path.join(__dirname, 'public/404.html');

//tras dados do banco para grafico
app.get('/data/:id', async(req, res) => {
  try {
    const document = await clique.find({
      slug: req.params.id,
    })

    //Send the found document in the response
    res.send(document);
    //console.log(document);
  } catch (err) {
    //Incase of an errror send a 404 NOT FOUND
    res.status(404).send({ error: "Document Not Found" })
  }

});

app.post('/API', slowDown({
  windowMs: 30 * 1000,
  delayAfter: 1,
  delayMs: 500,
}), rateLimit({
  windowMs: 30 * 1000,
  max: 2,
}), async (req, res, next) => {
  //let { slug, url } = req.body;
  var { shortcut } = req.body;
  var slug = shortcut;
  var { url } = req.body;
  var { API_KEY } = req.body;

  newrelic.setControllerName('API');

  try {
    await schema.validate({
      slug,
      url,
    });
    if (url.includes('urlto.info')) {
      throw new Error('Stop it. 🛑');
    }
    if(API_KEY === "6047a0218a9f8e001545678"){
      console.log(API_KEY);
    }else{
      throw new Error('Ops, you need an API KEY. 🔑');
    }
    if (!slug) {
      slug = nanoid(5);
    } else {
      const existing = await urls.findOne({ slug });
      if (existing) {
        throw new Error('shortcut in use. 🍔');
      }
    }
    slug = slug.toLowerCase();
    const newUrl = {
      url,
      slug,
    };
    const created = await urls.insert(newUrl);
    res.json(created);
  } catch (error) {
    next(error);
  }
});

app.get('/:id', async (req, res, next) => {
    
  newrelic.setControllerName('Home');
  
  const { id: slug } = req.params;
  try {
    const url = await urls.findOne({ slug });
    if (url) {
      newrelic.setControllerName(req.params.id);

      //grava acesso a url
      var datetime = new Date();
      var c = 1
      const clique_novo = {
        url,
        slug,
        datetime,
        c
      };

      console.log(clique_novo);
      clique.insert(clique_novo);
           
      //vai para pagina com retorno do banco
      return res.redirect(url.url);

    }
    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    return res.status(404).sendFile(notFoundPath);
  }
});

const schema = yup.object().shape({
  slug: yup.string().trim().matches(/^[\w\-]+$/i),
  url: yup.string().trim().url().required(),
});

app.post('/url', slowDown({
  windowMs: 30 * 1000,
  delayAfter: 1,
  delayMs: 500,
}), rateLimit({
  windowMs: 30 * 1000,
  max: 1,
}), async (req, res, next) => {
  let { slug, url } = req.body;
  try {
    await schema.validate({
      slug,
      url,
    });
    if (url.includes('urlto.info')) {
      throw new Error('Stop it. 🛑');
    }
    if (!slug) {
      slug = nanoid(5);
    } else {
      const existing = await urls.findOne({ slug });
      if (existing) {
        throw new Error('Slug in use. 🍔');
      }
    }
    slug = slug.toLowerCase();
    const newUrl = {
      url,
      slug,
    };
    const created = await urls.insert(newUrl);
    res.json(created);
  } catch (error) {
    next(error);
  }
});


app.use((req, res, next) => {
  res.status(404).sendFile(notFoundPath);
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
  });
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
