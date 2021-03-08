function myFunction() {
    alert("äfdasdf");
    /* Get the text field */
    var copyText = created;
  
    /* Select the text field */
    copyText.select(); 
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
  
    /* Copy the text inside the text field */
    document.execCommand("copy");
  
    /* Alert the copied text */
    alert("Copied the text: " + created);
  }