function UdpSocket ()
{
    this.port      = 0;
    this.bindAddr  = null;
    this.handle    = null;
    this.onReceive = null;

    UdpSocket.globals.ports.push (this);
}

UdpSocket.prototype.delete = function ()
{
    var index = UdpSocket.globals.sockets.indexOf (this);

    if (index >= 0)
    {
        if (UdpSocket.globals.sockets [index].handle)
            UdpSocket.globals.sockets.close ();

        UdpSocket.globals.sockets.splice (index, 1);
    }
}

UdpSocket.prototype.open = function (onOpen)
{
    var instance = this;

    chrome.sockets.up.create ({}, openCb);

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

UdpSocket.prototype.isOpen = function ()
{
    return this.handle !== null;
};

UdpSocket.globals = { ports: [] };

chrome.sockets.udp.onReceive.addListener (function (info)
                                          {
                                              var handleOwner = UdpSocket.globals.ports.find (function (port) { return port.handle === info.connectionId; });

                                              if (handleOwner && handleOwner.onReceive)
                                                  handleOwner.onReceive (info.data, info.remoteAddress, info.remotePort);
                                          });
