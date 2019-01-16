function UdpSocket ()
{
    this.port      = null;
    this.bindAddr  = null;
    this.handle    = null;
    this.objects   = UdpSocket.globals.ports;
    this.typeInfo  = { type: 'udp', value: 2 };

    Connector.apply (this, arguments);
}

UdpSocket.prototype = Object.create (Connector.prototype);

UdpSocket.prototype.used = function ()
{
    return this.port;
};

UdpSocket.prototype.open = function (onOpen)
{
    var instance = this;

    chrome.sockets.udp.create ({}, openCb);

    function openCb (info)
    {
        chrome.sockets.udp.bind (info.socketId, instance.bindAddr ? instance.bindAddr : '0.0.0.0', instance.port, bindCb);

        function bindCb (result)
        {
            if (result < 0)
            {
                chrome.sockets.udp.close (info.socketId);
            }
            else
            {
                instance.handle = info.socketId;

                if (onOpen)
                    onOpen (instance);
            }
        }
    }
};

UdpSocket.prototype.close = function (onClosed)
{
    if (this.handle)
    {
        var instance = this;

        chrome.sockets.udp.close (this.handle, callback);

        function callback (closed)
        {
            if (closed)
            {
                instance.handle = null;

                if (onClosed)
                    onClosed (instance);
            }
        }
    }
};

UdpSocket.globals   = { ports: [] };
UdpSocket.AllNics   = '0.0.0.0';
UdpSocket.LocalHost = '127.0.0.1';

UdpSocket.enumNic = function (onNicListLoaded)
{
    chrome.system.network.getNetworkInterfaces (onNicListLoaded);
};

chrome.sockets.udp.onReceive.addListener (function (info)
                                          {
                                              var handleOwner = UdpSocket.globals.ports.find (function (port) { return port.handle === info.socketId; });

                                              if (handleOwner && handleOwner.onReceive)
                                                  handleOwner.onReceive (info.data, Connector.types.udp, info.socketId, info.remoteAddress, info.remotePort);
                                          });
