var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-6128682-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// create GA event onerror
window.onerror = function(message, url, line) {
    if (typeof(_gaq) === "object") {
        _gaq.push([
            "_trackEvent",
            "onerror",
            message,
            (url + " (" + line + ")"),
            0, true
            ]);
    }
    return true;
};
function logEvent(category, label, arg) {
    console.log(category, label, arg);
    _gaq.push([
        "_trackEvent",
        category,
        label,
        arg,
        0, true
    ]);
}
