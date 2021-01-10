element = document.getElementsByClassName("tSmQ1")[0];

interval = setInterval(function(){element.scrollIntoView()}, 300);

// load images
images = document.getElementsByTagName("img");

for (image of images) {image.click()}

function saveImageAsFile(image)
{
    src = image.src;

    if (!src.startsWith("blob:https")) {
        return
    }

    // var a = document.createElement("a");
    // document.body.appendChild(a);
    // a.style = "display: none";

    // var url = window.URL.createObjectURL(blob);
    // a.href = url;
    // a.download = fileName;
    // a.click();
    // window.URL.revokeObjectURL(url);
    // document.body.removeChild(a);

    link = document.createElement("a");

    link.href = src;
    link.download = src.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // url = unescape(src);

    // url_parts = url.split("/").filter(function(item) {
    //     return item.includes(".jpg")
    // })

    // if (url_parts.length) {
    //     filename_parts = url_parts.shift().split("?")

    //     if (filename_parts.length) {
    //         filename = filename_parts.shift()

    //         console.log("download", src)

    //         link = document.createElement("a");

    //         link.href = src;
    //         link.download = filename;
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //     }
    // }
}

images_list = [].slice.call(images)

download_interval = null

download_interval = setInterval(function(){
    if (images.length === 0) {
        clearInterval(download_interval);
        
        return;
    }

    image = images_list.shift();

    saveImageAsFile(image);
}, 1000);

// save html

function saveTextAsFile()
{
    //inputTextToSave--> the text area from which the text to save is
    //taken from
    var textToSave = document.getElementsByClassName("tSmQ1")[0].innerHTML;
    var textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    //inputFileNameToSaveAs-->The text field in which the user input for 
    //the desired file name is input into.
    var downloadLink = document.createElement("a");
    downloadLink.download = "test.html";
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);

    downloadLink.click();
}

saveTextAsFile();