var allChannels  = [new SerialPort (), new SerialPort (), new UdpSocket (), new UdpSocket (), new Connector (), new Connector ()];
var channelIndex = -1;
var curConnector = null;
var curChannelLI = null;
var selectedPort = null;
var selectedUdp  = null;
var terminal     = null;
var pauseTerm    = null;
var connect      = null;
var termPaused   = true;
var connected    = false;
var updater      = null;
var map          = null;
var osType       = null;
var googleApi;

chrome.runtime.getPlatformInfo (function (info) { osType = info.os; });

allChannels.forEach (function (channel) { channel.onReceive = onReceive });

window.onload = function ()
                {
                    var channels;

                    setDataStorage (dataStorage);

                    initNmea ();
                    initGoogleMaps ();

                    SerialPort.enumPorts (onPortListLoaded);
                    UdpSocket.enumNic (onNicListLoaded);

                    //document.getElementById ('openCloseSerialPort').onclick = onOpenCloseSerialPort;
                    //document.getElementById ('openCloseUdpSocket').onclick  = onOpenCloseUdpSocket;

                    terminal  = document.getElementById ('terminal');
                    pauseTerm = document.getElementById ('startStopTerminal');
                    connect   = document.getElementById ('connectDisconnect');

                    document.getElementById ('udpNicList').onchange = function () { document.getElementById ('udpBind').value = this.value; };

                    pauseTerm.onclick = onPauseResumeTerminal;
                    connect.onclick   = onConnectDisconnect;

                    document.getElementById ('port').onchange     = onSelectPortIndex;
                    document.getElementById ('baud').onchange     = onSelectBaud;
                    document.getElementById ('parity').onchange   = onSelectParity;
                    document.getElementById ('byteSize').onchange = onSelectByteSize;
                    document.getElementById ('stopBits').onchange = onSelectStopBits;

                    document.getElementById ('udpPort').onchange  = onChangeUdpPort;
                    document.getElementById ('udpBind').onchange  = onChangeUdpBindAddr;

                    channels = document.getElementById ('channels').children;
                    
                    for (var i = 0; i < channels.length; ++ i)
                    {
                        channels [i].channelObj = allChannels [i];
                        channels [i].onclick    = function () { selectChannel (this, this.channelObj); };
                    }

                    updater = setInterval (onUpdate, 1000);

                    function onNicListLoaded (nics)
                    {
                        var nicList = document.getElementById ('udpNicList');
                        var i;

                        while (nicList.children.length > 0)
                            nicList.removeChild (nicList.children [0]);

                        for (i = 0, addItem (nicList, UdpSocket.AllNics), addItem (nicList, UdpSocket.LocalHost); i < nics.length; ++ i)
                        {
                            var addr = nics [i].address;

                            // Only IPv4 addresses
                            if (addr.indexOf (':') < 0)
                                addItem (nicList, addr);
                        }
                    }

                    function onPortListLoaded (ports)
                    {
                        var portList = document.getElementById ('port');
                        var i;

                        while (portList.children.length > 0)
                            portList.removeChild (portList.children [0]);

                        if (ports.length === 0 && osType !== 'win')
                        {
                            for (var i = 0; i <= 10; ++ i)
                                ports.push ('/dev/ttyS' + i.toString ());

                            ports.push ('/dev/ttyUSB0');
                            ports.push ('/dev/ttyUSB1');
                        }

                        for (i = 0, addItem (portList, SerialPort.notUsed); i < ports.length; ++ i)
                            addItem (portList, ports [i]);
                    }

                    function addItem (selectElem, portName)
                    {
                        var option = document.createElement ('option');

                        option.innerText = portName;

                        selectElem.appendChild (option);
                    }

                    function onUpdate ()
                    {
                        for (var typeKey in DataStorage.types)
                        {
                            var type = DataStorage.types [typeKey];
                            var cell = document.getElementById (type);

                            if (cell)
                                cell.innerText = dataStorage.getTextValue (type);
                        }
                    }
                };

/*function onOpenClose (buttonId, object)
{
    var button = document.getElementById (buttonId);

    if (object.isOpen ())
    {
        object.close ();

        button.innerText = 'Open';
    }
    else
    {
        object.open ();

        button.innerText = 'Close';

        terminal.innerText = '';
    }
}

function onOpenCloseSerialPort ()
{
    onOpenClose ('openCloseSerialPort', selectedPort);
}

function onOpenCloseUdpSocket ()
{
    onOpenClose ('openCloseUdpSocket', selectedUdp);
}
*/
function onChangeUdpPort ()
{
    if (channelIndex >= 0)
        allChannels [channelIndex].port = parseInt (this.value);
}

function onChangeUdpBindAddr ()
{
    if (channelIndex >= 0)
        allChannels [channelIndex].bindAddr = this.value;
}

function onSelectPortIndex ()
{
    if (channelIndex >= 0)
        allChannels [channelIndex].portName = this.options [this.selectedIndex].innerText;
}

function onSelectBaud ()
{
    if (channelIndex >= 0)
        allChannels [channelIndex].baud = parseInt (this.options [this.selectedIndex].innerText);
}

function onSelectByteSize ()
{
    if (channelIndex >= 0)
    {
        switch (parseInt (this.options [this.selectedIndex].innerText))
        {
            case 6:
                allChannels [channelIndex].byteSize = 'six'; break;

            case 7:
                allChannels [channelIndex].byteSize = 'seven'; break;

            case 8:
            default:
                allChannels [channelIndex].byteSize = 'eight'; break;
        }
    }
}

function onSelectParity ()
{
    if (channelIndex >= 0)
        allChannels [channelIndex].parity = SerialPort.parities [this.selectedIndex];
}

function onSelectStopBits ()
{
    if (channelIndex >= 0)
        allChannels [channelIndex].stopBits = SerialPort.stopBits [this.selectedIndex];
}

function selectSerialPort (index)
{
    //var button    = document.getElementById ('openCloseSerialPort');
    var ports     = document.getElementById ('port');
    var bauds     = document.getElementById ('baud');
    var byteSizes = document.getElementById ('byteSize');
    var stopBits  = document.getElementById ('stopBits');
    var parities  = document.getElementById ('parity');

    selectedPort = (index === null || index >= 2 || index < 0) ? null : allChannels [index];

    if (channelIndex >= 0)
    {
        /*if (allChannels [channelIndex].isOpen ())
            button.innerText = 'Open';
        else
            button.innerText = 'Close';*/

        for (var i = 0; i < ports.options.length; ++ i)
        {
            if (ports.options [i].innerText === allChannels [channelIndex].portName)
            {
                ports.selectedIndex = i; break;
            }
        }

        for (var i = 0; i < bauds.options.length; ++ i)
        {
            if (parseInt (bauds.options [i].innerText) === allChannels [channelIndex].baud)
            {
                bauds.selectedIndex = i; break;
            }
        }

        for (var i = 0; i < byteSizes.options.length; ++ i)
        {
            if (parseInt (byteSizes.options [i].innerText) === SerialPort.byteSizes [allChannels [channelIndex].byteSize])
            {
                byteSizes.selectedIndex = i; break;
            }
        }

        parities.selectedIndex = SerialPort.parities.indexOf (allChannels [channelIndex].parity);
        stopBits.selectedIndex = SerialPort.stopBits.indexOf (allChannels [channelIndex].stopBits);
    }
}

function selectUdpSocket (index)
{
    //var button    = document.getElementById ('openCloseUdpSocket');
    var port      = document.getElementById ('udpPort');
    var bind      = document.getElementById ('udpBind');

    selectedUdp = (index === null || index < 0 || index >= 2) ? null : allChannels [index];

    if (channelIndex >= 0)
    {
        /*if (allChannels [channelIndex].isOpen ())
            button.innerText = 'Open';
        else
            button.innerText = 'Close';*/

        port.value = allChannels [channelIndex].port ? allChannels [channelIndex].port : null;
        port.bind  = allChannels [channelIndex].bindAddr;
    }
}

function onConnectDisconnect ()
{
    connected = !connected;

    connect.innerText = connected ? 'Disconnect' : 'Connect';

    allChannels.forEach (function (channel)
                         {
                             if (channel.used ())
                             {
                                 if (connected)
                                     channel.open ();
                                 else
                                     channel.close ();
                             }
                         });
}

function onPauseResumeTerminal ()
{
    termPaused = !termPaused;

    pauseTerm.innerText = termPaused ? 'Start terminal' : 'Stop terminal';
}

function initGoogleMaps ()
{
    /*googleApi = document.createElement ('script');

    document.head.appendChild (googleApi);

    googleApi.type   = 'text/javascript';
    googleApi.src    = 'https://maps.googleapis.com/maps/api/js?libraries=geometry&key=AIzaSyCsZWmFuiHNNNIh5GSgkz6bhJuWhbtk21g';
    googleApi.onload = function ()
                       {
                           map = new google.maps.Map (document.getElementById ('mapDiv'),
                                                      { center: { lat: 59, lng: 9 }, zoom: 10, disableDefaultUI: true, mapTypeControl: false,
                                                        panControl: false, rotateControl: false, clickableIcons: false, streetViewControl: false });
                       };*/
}

function onReceive (arrayBuffer, connectorType, handle)
{
    var byteBuffer = new Uint8Array (arrayBuffer);
    var data;
    var i;

    for (i = 0, data = ''; i < byteBuffer.length; data += String.fromCharCode (byteBuffer [i++]));

    parsers.parse (data);

    if (!termPaused && curConnector && curConnector.typeInfo.value === connectorType && curConnector.handle === handle)
    {
        terminal.innerText += data;
        terminal.scrollTop  = 100000;

        if (terminal.innerText.length > 5000)
            terminal.innerText = '';
    }
}
