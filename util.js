function getCurTime ()
{
    return new Date ().getTime ();
}

function selectChannel (obj)
{
    var channels       = document.getElementById ('channels');
    var serialSettings = document.getElementById ('serialSettings');
    var udpSettings    = document.getElementById ('udpSettings');

    for (var i = 0; i < channels.children.length; ++ i)
    {
        var selected = channels.children [i] === obj;

        channels.children [i].className = selected ? 'selectedChannel' : null;

        if (selected)
        {
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
