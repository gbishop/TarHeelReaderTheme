define(["templates", "state" ], function(templates, state) {
    var SpeechBase = "/cache/speech/";
    var languages = templates.get('languages');
    var hasSpeech = {};
    for(var i=0; i<languages.length; i++) {
        hasSpeech[languages[i].value] = languages[i].speech;
    }
    var audio = null; // the html5 audio node will go here if we use it
    function initialize () {
        if (audio) return;

        // use html5 audio if it is available and if it supports mp3.
        // I'd rather use ogg but I need mp3 for flash fallback anyway.
        // To make it work on the iOS I apparently have to load a legal mp3.
        // Use this one for now.
        if (typeof(Audio) !== 'undefined') {
            audio = new Audio('/theme/speech/probe.mp3');

            if (audio && audio.canPlayType &&
                ("no" != audio.canPlayType("audio/mpeg")) &&
                ("" !== audio.canPlayType("audio/mpeg"))) {
                $('.flashplayer').remove();
                //console.log('seem to have audio mp3');
                // register an error handler for firefox 23 which says it can play my mp3 and then fails
                var $audio = $(audio);
                $audio.one('error', function(e) {
                    //console.log('error callback');
                    if (e.target.error.code == e.target.error.MEDIA_ERR_DECODE ||
                        e.target.error.code == e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                        audio = 'flash';
                    }
                });
                $audio.one('canplay', function(e) {
                    //console.log('canplay callback');
                    $audio.off('error');
                });
                // we appear to have html5 audio so call load
                audio.load();
                // now this node is blessed so we can play sound whenever we want.

            } else {
                //console.log('failed audio test, using flash');
                // otherwise signal that we'll be using flash
                audio = 'flash';
            }
        } else {
            //console.log('defaulting to flash');
            audio = 'flash';
        }
    }

    // fake up what Modernizr might do for speechsynthesis
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        Modernizr.speechsynthesis = true;
        $('html').addClass('speechsynthesis');
    }

    $(function() {
        // wait for a user interaction to initialize audio because Apple knows best
        $(document.body).one('mousedown keydown touchstart', function(e) {
            initialize();
            if (Modernizr.speechsynthesis) {
                var msg = new SpeechSynthesisUtterance(' ');
                window.speechSynthesis.speak(msg);
                window.speechSynthesis.cancel();
            }
        });
    });

    var browserLang = {
        'en': 'en-US',
        'de': 'de-DE',
        'es': 'es-US',
        'fr': 'fr-FR',
        'it': 'it-IT',
        'ko': 'ko-KO',
        'pt': 'pt-BR'
    };
    function browserPlay(id, page, lang, text, bust) {
        //console.log('bp', id, page, lang, text);
        if (id == 'site') {
            var siteSpeech = templates.get('siteSpeech'),
                key = page + '-c';
            text = siteSpeech[key].text;
        }
        window.speechSynthesis.cancel();
        var msg = new SpeechSynthesisUtterance(text);
        if (lang in browserLang)
            lang = browserLang[lang];
        msg.lang = lang;
        //msg.rate = 0.3; // needed on ios8, others ignore?
        window.speechSynthesis.speak(msg);
    }

    function play(id, page, lang, text, bust) {
        var voice = state.get('voice')[0];
        //console.log('play', id, page, lang, voice, text, bust);

        if (voice == 'b' && Modernizr.speechsynthesis) {
            return browserPlay(id, page, lang, text, bust);
        }
        if (!audio || voice === 's' || !hasSpeech[lang] || state.offline()) {
            return;
        }

        var mp3 = SpeechBase;
        if (id == 'site') {
            var siteSpeech = templates.get('siteSpeech');
            key = page + '-' + voice;
            mp3 = siteSpeech[key].url;
        } else {
            id = id + '';
            mp3 += id.substr(id.length-2) + '/' + id + '/' + page + '-' + voice + '.mp3';
            if (bust) {
                mp3 += '?bust=' + bust;
            }
        }

        if (audio === 'flash') {
            $('.flashplayer').remove();
            var view = { eurl: encodeURI(mp3) };
            $('body').append(templates.render('flash', view));
        } else {
            audio.src = mp3;
            audio.load();
            audio.play();
        }
    }

    return {
        play: play,
        hasSpeech: hasSpeech
    };

});
