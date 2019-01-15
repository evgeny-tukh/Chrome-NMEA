function getCurTime ()
{
    return new Date ().getTime ();
}

function selectChannel (liElem, channelObj)
{
    var channels       = document.getElementById ('channels');
    var serialSettings = document.getElementById ('serialSettings');
    var udpSettings    = document.getElementById ('udpSettings');

    curChannelLI = liElem;
    curConnector = channelObj;

    if (terminal && !termPaused)
        terminal.innerText = '';

    channelIndex = -1;

    for (var i = 0; i < channels.children.length; ++ i)
    {
        var selected = channels.children [i] === liElem;

        channels.children [i].className = selected ? 'selectedChannel' : null;

        if (selected)
        {
            channelIndex = i;

            if (i < 2)
            {
                serialSettings.style.display = null;

                selectSerialPort (i);
            }
            else
            {
                serialSettings.style.display = 'none';

                selectSerialPort (null);
            }

            if (i >= 2 && i < 4)
            {
                udpSettings.style.display = null;

                selectUdpSocket (i - 2);
            }
            else
            {
                udpSettings.style.display = 'none';

                selectUdpSocket (null);
            }
        }
    }
}
