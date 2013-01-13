define(["templates" ], function(templates) {
    var SpeechBase = "/cache/speech/";
    var languages = templates.get('languages');
    var hasSpeech = {};
    for(var i=0; i<languages.length; i++) {
        hasSpeech[languages[i].value] = languages[i].speech;
    }
    var audio = null; // the html5 audio node will go here if we use it
    function initialize () {
        if (audio) return;

        // use html5 audio if it is available and if it supports mp3. I'd rather use ogg but I need mp3 for
        // flash fallback anyway
        // to make it work on the iPad I apparently have to load a legal mp3. Use this one for now.
        console.log('initialize audio');
        if (typeof(Audio) !== 'undefined') {
            console.log('have Audio function');
            audio = new Audio(SpeechBase + 'site/en-c-whatnow.mp3');

           if (audio && audio.canPlayType &&
                ("no" != audio.canPlayType("audio/mpeg")) &&
                ("" !== audio.canPlayType("audio/mpeg"))) {
                console.log('passed audio test');
                $('.flashplayer').remove();
                // we appear to have html5 audio so call load which is required on the iPod.
                audio.load();
                // now this node is blessed so we can play sound whenever we want.

            } else {
                console.log('failed audio test, using flash');
                // otherwise signal that we'll be using flash
                audio = 'flash';
            }
        } else {
            console.log('defaulting to flash');
            audio = 'flash';
        }
    }

    $(function() {
        if (navigator.userAgent.match(/iPad/i) !== null || navigator.platform.match(/iPhone|iPod/) !== null) {
            // wait for a user interaction to initialize audio because Apple knows best
            $(document.body).one('mousedown', function(e) {
                initialize();
            });
        } else { // for anyone else I should be able to simply initialize
            initialize();
        }
    });

    function play(id, lang, voice, page, bust) {
        voice = voice[0]; // assure we're only using the 1st letter
        console.log('play', id, lang, voice, page);
        if (!audio || voice === 's' || !hasSpeech[lang]) {
            return;
        }

        var mp3 = SpeechBase;
        if (id == 'site') {
            mp3 += 'site/' + lang + '-' + voice + '-' + page + '.mp3';
        } else {
            id = id + '';
            mp3 += id.substr(id.length-2) + '/' + id + '/' + lang + '-' + voice + '-' + page + '.mp3';
        }
        if (bust) {
            mp3 += '?bust=' + bust;
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
        play: play
    };

});
