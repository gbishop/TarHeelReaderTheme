define(["jquery", "templates" ], function($, templates) {
    var SpeechBase = "/cache/speech/";
    var audio = null; // the html5 audio node will go here if we use it
    function initialize () {
        if (audio) return;

        // use html5 audio if it is available and if it supports mp3. I'd rather use ogg but I need mp3 for
        // flash fallback anyway
        // to make it work on the iPad I apparently have to load a legal mp3. Use this one for now.
        audio = new Audio(SpeechBase + 'site/en-c-whatnow.mp3');
        if (audio && audio.canPlayType &&
            ("no" != audio.canPlayType("audio/mpeg")) &&
            ("" !== audio.canPlayType("audio/mpeg"))) {
            $('.flashplayer').remove();
            // we appear to have html5 audio so call load which is required on the iPod.
            audio.load();
            // now this node is blessed so we can play sound whenever we want.

        } else {
            // otherwise signal that we'll be using flash
            audio = 'flash';
        }
    }

    $(function() {
        if (navigator.userAgent.match(/iPad/i) !== null || navigator.platform.match(/iPhone|iPod/) !== null) {
            // wait for a user interaction to initialize
            $('body').on('tap.audio', function(e) {
                // unhook the event
                $('body').off('tap.audio');
                // create the audio node
                initialize();
            });
        } else { // for anyone else I should be able to simply initialize
            initialize();
        }
    });

    function play(id, lang, voice, page) {
        if (!audio || voice === 's') return;

        var mp3 = SpeechBase;
        if (id == 'site') {
            mp3 += 'site' + lang + '-' + voice + '-' + page + '.mp3';
        } else {
            mp3 += id.substr(id.length-2) + '/' + id + '/' + lang + '-' + voice + '-' + page + '.mp3';
        }

        if (audio === 'flash') {
            $('.flashplayer').remove();
            $('body').append(templates.flash(mp3));
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