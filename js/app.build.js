({
    appDir: "../",
    baseUrl: "js",
    dir: "../../Theme-build",
    paths: {
        "jquery": "require-jquery"
    },

    modules: [
        //Optimize the require-jquery.js file by applying any minification
        //that is desired via the optimize: setting above.
        {
            name: "require-jquery"
        },

        {
            name: "main",
            exclude: ["jquery"]
        }
    ]
})