define([], function(){
    /* poll for commands to run. I mostly use it with window.location.reload(true); */

    function remoteCommand() {
        $.ajax({
            url: "/theme/remoteCommand.php",
            cache: false,
            timeout: 100000,

            success: function(data) {
                if (data != 'no') {
                    eval(data);
                }
                setTimeout(remoteCommand, 5000);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log("error", textStatus + " (" + errorThrown + ")");
                setTimeout(remoteCommand, 5000);
            }
        });
    }
    remoteCommand();

});
