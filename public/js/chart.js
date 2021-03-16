$(function () {
    var processed_json = new Array();   
    $.getJSON('http://localhost:1337/data/mys', function(data) {
        // Populate series
        for (i = 0; i < data.length; i++){
            processed_json.push([data[i].key, data[i].value]);
        }
     
        // draw chart
        $('#container_v3').highcharts({
        chart: {
            type: "column"
        },
        title: {
            text: "Student data"
        },
        xAxis: {
            type: 'category',
            allowDecimals: false,
            title: {
                text: ""
            }
        },
        yAxis: {
            title: {
                text: "Scores"
            }
        },
        series: [{
            name: 'Subjects',
            data: processed_json
        }]
    }); 
});
});