function Connector ()
{
    this.error     = null;
    this.handle    = null;
    this.onReceive = null;

    if ('typeInfo' in this && !(this.typeInfo.type in Connector.types))
        Connector.types [this.typeInfo.type] = this.typeInfo.value;

    if (this.objects)
        this.objects.push (this);
}

Connector.types = {};

Connector.prototype.used = function ()
{
    return false;
};

Connector.prototype.delete = function ()
{
    var index = this.objects.indexOf (this);

    if (index >= 0)
    {
        if (this.objects [index].handle)
            this.objects [index].close ();

        this.objects.splice (index, 1);
    }
}

Connector.prototype.isOpen = function ()
{
    return this.handle !== null;
};

