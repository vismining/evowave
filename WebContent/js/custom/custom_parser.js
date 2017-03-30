var xhttp = new XMLHttpRequest();

xhttp.overrideMimeType("application/json");

xhttp.open("GET", "new.json", true);

xhttp.onreadystatechange = function() {
    if(xhttp.readyState == 4 && xhttp.status == "200") {
        var container = document.querySelector("#container");
        var responseText = xhttp.responseText;
        var responseObj = JSON.parse(responseText);

        console.log(responseObj);
        container.innerHTML = responseText;
    }
}
xhttp.send();