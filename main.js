var serialPorts  = [new SerialPort (), new SerialPort ()];
var udpSockets   = [new UdpSocket (), new UdpSocket ()];
var selectedPort = null;
var selectedUdp  = null;
var terminal     = null;
var pause        = null;
var paused       = true;
var updater      = null;
var map          = null;
var googleApi;

serialPorts.forEach (function (port) { port.onReceive = onReceive; });
udpSockets.forEach (function (socket) { socket.onReceive = onReceive; });

window.onload = function ()
                {
                    var channels;

                    setDataStorage (dataStorage);

                    initNmea ();
                    initGoogleMaps ();

                    SerialPort.enumPorts (onPortListLoaded);

                    document.getElementById ('openCloseSerialPort').onclick = onOpenCloseSerialPort;
                    document.getElementById ('openCloseUdpSocket').onclick  = onOpenCloseUdpSocket;

                    terminal = document.getElementById ('terminal');
                    pause    = document.getElementById ('startStopTerminal');

                    pause.onclick = onPauseResumeTerminal;

                    document.getElementById ('port').onchange     = onSelectPortIndex;
                    document.getElementById ('baud').onchange     = onSelectBaud;
                    document.getElementById ('parity').onchange   = onSelectParity;
                    document.getElementById ('byteSize').onchange = onSelectByteSize;
                    document.getElementById ('stopBits').onchange = onSelectStopBits;

                    document.getElementById ('udpPort').onchange  = onChangeUdpPort;
                    document.getElementById ('udpBind').onchange  = onChangeUdpBindAddr;

                    channels = document.getElementById ('channels').children;
                    
                    for (var i = 0; i < channels.length; ++ i)
                        channels [i].onclick = function () { selectChannel (this); };

                    updater = setInterval (onUpdate, 1000);

                    function onPortListLoaded (ports)
                    {
                        var portList = document.getElementById ('port');
                        var i;

                        for (i = 0; i < ports.length; ++ i)
                        {
                            var option = document.createElement ('option');

                            option.innerText = ports [i];

                            portList.appendChild (option);
                        }
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

function onOpenClose (buttonId, object)
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

function onChangeUdpPort ()
{
    if (selectedUdp)
        selectedUdp.port = parseInt (this.value);
}

function onChangeUdpBindAddr ()
{
    if (selectedUdp)
        selectedUdp.bindAddr = this.value;
}

function onSelectPortIndex ()
{
    if (selectedPort)
        selectedPort.portName = this.options [this.selectedIndex].innerText;
}

function onSelectBaud ()
{
    if (selectedPort)
        selectedPort.baud = parseInt (this.options [this.selectedIndex].innerText);
}

function onSelectByteSize ()
{
    if (selectedPort)
    {
        switch (parseInt (this.options [this.selectedIndex].innerText))
        {
            case 6:
                selectedPort.byteSize = 'six'; break;

            case 7:
                selectedPort.byteSize = 'seven'; break;

            case 8:
            default:
                selectedPort.byteSize = 'eight'; break;
        }
    }
}

function onSelectParity ()
{
    if (selectedPort)
        selectedPort.parity = SerialPort.parities [this.selectedIndex];
}

function onSelectStopBits ()
{
    if (selectedPort)
        selectedPort.stopBits = SerialPort.stopBits [this.selectedIndex];
}

function selectSerialPort (index)
{
    var button    = document.getElementById ('openCloseSerialPort');
    var ports     = document.getElementById ('port');
    var bauds     = document.getElementById ('baud');
    var byteSizes = document.getElementById ('byteSize');
    var stopBits  = document.getElementById ('stopBits');
    var parities  = document.getElementById ('parity');

    selectedPort = (index === null) ? null : serialPorts [index];

    if (selectedPort !== null)
    {
        if (selectedPort.isOpen ())
            button.innerText = 'Open';
        else
            button.innerText = 'Close';

        for (var i = 0; i < ports.options.length; ++ i)
        {
            if (ports.options [i].innerText === selectedPort.portName)
            {
                ports.selectedIndex = i; break;
            }
        }

        for (var i = 0; i < bauds.options.length; ++ i)
        {
            if (parseInt (bauds.options [i].innerText) === selectedPort.baud)
            {
                bauds.selectedIndex = i; break;
            }
        }

        for (var i = 0; i < byteSizes.options.length; ++ i)
        {
            if (parseInt (byteSizes.options [i].innerText) === SerialPort.byteSizes [selectedPort.byteSize])
            {
                byteSizes.selectedIndex = i; break;
            }
        }

        parities.selectedIndex = SerialPort.parities.indexOf (selectedPort.parity);
        stopBits.selectedIndex = SerialPort.stopBits.indexOf (selectedPort.stopBits);
    }
}

function selectUdpSocket (index)
{
    var button    = document.getElementById ('openCloseUdpSocket');
    var port      = document.getElementById ('udpPort');
    var bind      = document.getElementById ('udpBind');

    selectedUdp = (index === null) ? null : udpSockets [index];

    if (selectedUdp !== null)
    {
        if (selectedUdp.isOpen ())
            button.innerText = 'Open';
        else
            button.innerText = 'Close';

        port.value = selectedUdp.port;
        port.bind  = selectedUdp.bindAddr;
    }
}

function onPauseResumeTerminal ()
{
    paused = !paused;

    pause.innerText = paused ? 'Start terminal' : 'Stop terminal';
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

function onReceive (arrayBuffer)
{
    var byteBuffer = new Uint8Array (arrayBuffer);
    var data;
    var i;

    for (i = 0, data = ''; i < byteBuffer.length; data += String.fromCharCode (byteBuffer [i++]));

    parsers.parse (data);

    if (!paused)
    {
        terminal.innerText += data;
        terminal.scrollTop  = 100000;

        if (terminal.innerText.length > 5000)
            terminal.innerText = '';
    }
}
