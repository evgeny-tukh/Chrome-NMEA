function SerialPort ()
{
    this.portName  = SerialPort.notUsed;
    this.baud      = 4800;
    this.byteSize  = 'eight';
    this.parity    = 'no';
    this.stopBits  = 'one';
    this.bufSize   = 4096;
    this.objects   = SerialPort.globals.ports;
    this.typeInfo  = { type: 'serial', value: 1 };

    Connector.apply (this, arguments);
}

SerialPort.prototype = Object.create (Connector.prototype);
SerialPort.notUsed   = 'Not used';
SerialPort.parities  = ['no', 'odd', 'even', 'mark', 'space'];
SerialPort.stopBits  = ['one', 'oneandhalf', 'two'];
SerialPort.byteSizes = { six: 6, seven: 7, eight: 8 };

SerialPort.enumPorts = function (callback)
{
    if (typeof (chrome) !== 'undefined' && chrome.serial)
        chrome.serial.getDevices (onGetPortList);

    function onGetPortList (portList)
    {
        var ports = [];

        portList.forEach (function (port)
                         {
                             ports.push (port.path);
                         });

        ports.sort ();

        if (callback)
            callback (ports);
    }
};

SerialPort.prototype.used = function ()
{
    return this.portName && this.portName !== SerialPort.notUsed;
};

SerialPort.prototype.open = function (onOpen)
{
    var instance = this;
    var options  = { persistent: true, bufferSize: this.bufferSize, bitrate: this.baud, dataBits: this.byteSize, parityBit: this.parity,
                     stopBits: this.stopBits };

    chrome.serial.connect (this.portName, options, callback);

    function callback (info)
    {
        if (info)
        {
            instance.handle = info.connectionId;
            instance.error  = null;

            if (onOpen)
                onOpen (instance);
        }
        else
        {
            instance.error  = chrome.runtime.lastError;
            instance.handle = null;
        }
    }
};

SerialPort.prototype.close = function (onClosed)
{
    if (this.handle)
    {
        var instance = this;

        chrome.serial.disconnect (this.handle, callback);

        function callback (closed)
        {
            if (closed)
            {
                instance.handle = null;
                instance.error  = null;

                if (onClosed)
                    onClosed (instance);
            }
            else
            {
                instance.error = chrome.runtime.lastError;
            }
        }
    }
};

SerialPort.globals = { ports: [] };

chrome.serial.onReceive.addListener (function (info)
                                     {
                                         var handleOwner = SerialPort.globals.ports.find (function (port) { return port.handle === info.connectionId; });

                                         if (handleOwner && handleOwner.onReceive)
                                             handleOwner.onReceive (info.data, Connector.types.serial, info.connectionId);
                                     });
