/*****************************************************************************\

 Javascript SOAP Client
 Forked from javascriptsoapclient.codeplex.com and improved by gtathub.

 For new versions check: https://github.com/gtathub/js-soap-client

 * Original work by Matteo Casati (based on v2.4 from 2007-12-21)
 * Improved by Gordon Tschirner (https://github.com/gtathub)
 * Licensed under GPLv2: https://github.com/gtathub/js-soap-client.git
\*****************************************************************************/

function SOAPClientParameters()
{
    var _pl = new Array();
    var _sl = new Array();
    this.add = function(name, value)
    {
        _pl[name] = value;
        return this;
    };
    this.addSchema = function(prefix, uri) {
        _sl[prefix] = uri;
        return this;
    };
    this.toXml = function()
    {
        var xml = "";
        for(var p in _pl)
        {
            switch(typeof(_pl[p]))
            {
                case "string":
                case "number":
                case "boolean":
                case "object":
                    xml += SOAPClientParameters._serialize(p, _pl[p]);
                    break;
                default:
                    break;
            }
        }
        return xml;
    };
    this.printSchemaList = function() {
        var list = [];

        for (var prefix in _sl) {
            if (_sl.hasOwnProperty(prefix)) {
                list.push('xmlns:' + prefix + '="' + _sl[prefix] + '"');
            }
        }

        return list.join(' ');
    }
}
SOAPClientParameters._serialize = function(t, o)
{
    var s = "";
    switch(typeof(o))
    {
        case "string":
            s += "<" + t + ">";
            s += o.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            s += "</" + t + ">";
            break;
        case "number":
        case "boolean":
            s += "<" + t + ">";
            s += o.toString();
            s += "</" + t + ">";
            break;
        case "object":
            // Date
            if(o.constructor.toString().indexOf("function Date()") > -1)
            {

                var year = o.getFullYear().toString();
                var month = (o.getMonth() + 1).toString();
                month = (month.length == 1) ? "0" + month : month;
                var date = o.getDate().toString();
                date = (date.length == 1) ? "0" + date : date;
                var hours = o.getHours().toString();
                hours = (hours.length == 1) ? "0" + hours : hours;
                var minutes = o.getMinutes().toString();
                minutes = (minutes.length == 1) ? "0" + minutes : minutes;
                var seconds = o.getSeconds().toString();
                seconds = (seconds.length == 1) ? "0" + seconds : seconds;
                var milliseconds = o.getMilliseconds().toString();
                var tzminutes = Math.abs(o.getTimezoneOffset());
                var tzhours = 0;
                while(tzminutes >= 60)
                {
                    tzhours++;
                    tzminutes -= 60;
                }
                tzminutes = (tzminutes.toString().length == 1) ? "0" + tzminutes.toString() : tzminutes.toString();
                tzhours = (tzhours.toString().length == 1) ? "0" + tzhours.toString() : tzhours.toString();
                var timezone = ((o.getTimezoneOffset() < 0) ? "+" : "-") + tzhours + ":" + tzminutes;
                s += "<" + t + ">";
                s += year + "-" + month + "-" + date + "T" + hours + ":" + minutes + ":" + seconds + "." + milliseconds + timezone;
                s += "</" + t + ">";
            }
            // Array
            else if(o.constructor.toString().indexOf("function Array()") > -1)
            {

                s += "<" + t + " SOAP-ENC:arrayType=\"SOAP-ENC:Array[" + o.length + "]\" xsi:type=\"SOAP-ENC:Array\">";
                for(var p in o)
                {
                    if(!isNaN(p))   // linear array
                    {
                        (/function\s+(\w*)\s*\(/ig).exec(o[p].constructor.toString());
                        var type = RegExp.$1;
                        switch(type)
                        {
                            case "":
                                type = typeof(o[p]);
                            case "String":
                                type = "string";
                                break;
                            case "Number":
                                type = "int";
                                break;
                            case "Boolean":
                                type = "bool";
                                break;
                            case "Date":
                                type = "DateTime";
                                break;
                        }
                        s += SOAPClientParameters._serialize("item", o[p]);
                    }
                    else    // associative array
                    {
                        SOAPClientParameters._serialize("item", o[p]);
                    }
                }
                s += "</" + t + ">";
            }
            // Object or custom function
            else {
                s += "<" + t + ">";
                for (var p in o) {
                    s += SOAPClientParameters._serialize(p, o[p]);
                }
                s += "</" + t + ">";
            }
            break;
        default:
            break; // throw new Error(500, "SOAPClientParameters: type '" + typeof(o) + "' is not supported");
    }
    return s;
}

function SOAPClient() {}

SOAPClient.contentStart = '<?xml version="1.0" encoding="utf-8"?> \
<soap:Envelope \
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
 xmlns:xsd="http://www.w3.org/2001/XMLSchema"\
 xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"> \
<soap:Body> \
<ELOYAPPISubmit xmlns="http://pcmprofiles.biz/PPIcalc">';
SOAPClient.contentEnd = '</ELOYAPPISubmit> \
</soap:Body> \
</soap:Envelope>';

SOAPClient.invoke = function(url, parameters, soapaction, successCallback, errorCallback)
{
    var data = SOAPClient.contentStart + parameters.toXml() + SOAPClient.contentEnd;
    Parse.Cloud.httpRequest({
        url: url,
        method: 'POST',
        headers: {
            SOAPAction: soapaction,
            "Content-Type": "text/xml; charset=utf-8",
            "Content-Length": data.length
        },
        body: data
    }).then(function(httpResponse) {
        if (successCallback) {
            successCallback(httpResponse);
        }
    }, function(httpResponse) {
        if (errorCallback) {
            errorCallback(httpResponse);
        }
    });
};

exports.SOAPClient = SOAPClient;
exports.SOAPClientParameters = SOAPClientParameters;
