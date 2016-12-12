var ColorTransition = function(fromColor, toColor, steps){
    var self = this;
    var colors = [];
    var numSteps;

    var __construct__ = function(fromColor, toColor, steps){
        if (!fromColor) fromColor = new Color();
        if (!toColor) toColor = new Color();
        if (!steps) steps = 5;

        numSteps = steps;

        colors.push(fromColor);

        var toH = toColor.getCIELCh_H();
        var fromH = fromColor.getCIELCh_H();
        var diff = toH - fromH;
        if (Math.abs(diff) > 180) {
            if (diff > 0) {
                fromH += 360;
            }
            else {
                toH += 360;
            }
        }

        var stepInterval = 1 / (numSteps+1);
        for (var i=0; i<numSteps; i++) {
            var value = (i+1)*stepInterval;

            var l = fromColor.getCIELCh_L() + (toColor.getCIELCh_L() - fromColor.getCIELCh_L())*value;
            var c = fromColor.getCIELCh_C() + (toColor.getCIELCh_C() - fromColor.getCIELCh_C())*value;
            var h = fromH + (toH - fromH)*value;

            var color = new Color(l, c, h, ColorMode.CIELCh);
            colors.push(color);
        }

        colors.push(toColor);
    }

    this.getColorAtValue = function(value){
        var stepInterval = 1 / (numSteps+1);
        var lowValue = Math.floor(value/stepInterval);
        var highValue = Math.ceil(value/stepInterval);

        if (lowValue == highValue) {
            var color = colors[lowValue];
            return new Color(color.getRed(),color.getGreen(),color.getBlue());
        }
        else {
            var adjustedValue = (value-(lowValue*stepInterval))/stepInterval;
            var lowColor = colors[lowValue];
            var highColor = colors[highValue];
            var r = lowColor.getRed() + (highColor.getRed() - lowColor.getRed())*adjustedValue;
            var g = lowColor.getGreen() + (highColor.getGreen() - lowColor.getGreen())*adjustedValue;
            var b = lowColor.getBlue() + (highColor.getBlue() - lowColor.getBlue())*adjustedValue;
            return new Color(r, g, b);
        }
    }

    __construct__(fromColor, toColor, steps);
}

/* Code for converting from RGB to CIE-LCh adapted from Stuart Denman, http://www.stuartdenman.com/improved-color-blending/ */

var ColorMode = {};
ColorMode.RGB = 0;
ColorMode.HSV = 1;
ColorMode.CIELCh = 2;

var Color = function(r,g,b,mode){
    var self=this;

    var rgbDirty = true;
    var hsvDirty = true;
    var cielchDirty = true;

    var red=0;
    var green=0;
    var blue=0;

    var hue=0;
    var saturation=0;
    var value=0;

    var xyz_x=0;
    var xyz_y=0;
    var xyz_z=0;

    var cielab_l=0;
    var cielab_a=0;
    var cielab_b=0;

    var cielch_l=0;
    var cielch_c=0;
    var cielch_h=0;

    var __construct__ = function(r,g,b,mode){
        if(!mode){
            mode = ColorMode.RGB;
        }

        if(mode == ColorMode.RGB){
            if (r) red = bound(r, 0, 255);
            if (g) green = bound(g, 0, 255);
            if (b) blue = bound(b, 0, 255);
            rgbDirty = false;
        }
        else if(mode == ColorMode.HSV){
            if (r) hue = bound(r, 0, 360);
            if (g) saturation = bound(g, 0, 100);
            if (b) value = bound(b, 0, 100);
            hsvDirty = false;
        }
        else if(mode == ColorMode.CIELCh){
            if (r) cielch_l = r;
            if (g) cielch_c = g;
            if (b) cielch_h = b < 360 ? b : (b - 360);
            cielchDirty = false;
        }
    }

    this.logRGB = function() {
        console.log({red: self.getRed(), green: self.getGreen(), blue: self.getBlue()});
    }

    this.logHSV = function() {
        console.log({hue: self.getHue(), saturation: self.getSaturation(), value: self.getValue()});
    }

    this.logCIELCh = function() {
        console.log({l: self.getCIELCh_L(), c:self.getCIELCh_C(), h: self.getCIELCh_H()});
    }

    this.getHex = function(){
        cleanForRGB();

        var tempRed = Math.round(red);
        var tempGreen = Math.round(green);
        var tempBlue = Math.round(blue);

        var hex = (tempRed << 16) + (tempGreen << 8) + tempBlue;
        var hexString = hex.toString(16);
        while (hexString.length < 6) hexString = "0"+hexString;
        return "#"+hexString;
    }

    this.getRed = function(){
        cleanForRGB();
        return red;
    }

    this.setRed = function(r){
        cleanForRGB();
        red = bound(r, 0, 255);
        rgbModified();
    }

    this.getGreen = function(){
        cleanForRGB();
        return green;
    }

    this.setGreen = function(g){
        cleanForRGB();
        green = bound(g, 0, 255);
        rgbModified();
    }

    this.getBlue = function(){
        cleanForRGB();
        return blue;
    }

    this.setBlue = function(b){
        cleanForRGB();
        blue = bound(b, 0, 255);
        rgbModified();
    }

    this.getHue = function(){
        cleanForHSV();
        return hue;
    }

    this.setHue = function(h){
        cleanForHSV();
        hue = bound(h, 0, 360);
        hsvModified();
    }

    this.getSaturation = function(){
        cleanForHSV();
        return saturation;
    }

    this.setSaturation = function(s){
        cleanForHSV();
        saturation = bound(s, 0, 100);
        hsvModified();
    }

    this.getValue = function(){
        cleanForHSV();
        return value;
    }

    this.setValue = function(v){
        cleanForHSV();
        value = bound(v, 0, 100);
        hsvModified();
    }

    this.getCIELCh_L = function(){
        cleanForCIELCh();
        return cielch_l;
    }

    this.setCIELCH_L = function(l){
        cleanForCIELCh();
        cielch_l = bound(l, 0, 100);
        cielchModified();
    }

    this.getCIELCh_C = function(){
        cleanForCIELCh();
        return cielch_c;
    }

    this.setCIELCH_C = function(c){
        cleanForCIELCh();
        cielch_c = bound(c, 0, 100);
        cielchModified();
    }

    this.getCIELCh_H = function(){
        cleanForCIELCh();
        return cielch_h;
    }

    this.setCIELCH_H = function(h){
        cleanForCIELCh();
        cielch_h = h < 360 ? h : (h - 360);
        cielchModified();
    }

    var convertHSVtoRGB = function(){
        var h = hue;
        var s = saturation;
        var v = value;

        var r, g, b;
        var f, p, q, t;
        var i;

        s /= 100;
        v /= 100;

        if(s == 0){
            r = g = b = v;
        }
        else {
            h /= 60; // sector 0 to 5
            i = Math.floor(h);
            f = h - i; // factorial part of h
            p = v * (1 - s);
            q = v * (1 - s * f);
            t = v * (1 - s * (1 - f));

            switch(i){
                case 0:
                    r = v;
                    g = t;
                    b = p;
                    break;

                case 1:
                    r = q;
                    g = v;
                    b = p;
                    break;

                case 2:
                    r = p;
                    g = v;
                    b = t;
                    break;

                case 3:
                    r = p;
                    g = q;
                    b = v;
                    break;

                case 4:
                    r = t;
                    g = p;
                    b = v;
                    break;

                default:
                    r = v;
                    g = p;
                    b = q;
                    break;
            }
        }

        red = bound((r * 255), 0, 255);
        green = bound((g * 255), 0, 255);
        blue = bound((b * 255), 0, 255);
    }

    var convertRGBtoHSV = function(){
        var r = red;
        var g = green;
        var b = blue;

        var min = Math.min(r, g, b);
        var max = Math.max(r, g, b);
        var delta =  max - min;

        var h = max;
        var s = max;
        var v = max;

        v = max / 255 * 100;

        if(max != 0){
            s = delta / max * 100;

            if(r == max) h = (g - b) / delta;
            else if(g == max) h = 2 + (b - r) / delta;
            else h = 4 + (r - g) / delta;

            h = h * 60;
            if(h < 0) h += 360;
        }

        hue = h;
        saturation = s;
        value = v;
    }

    var convertRBGtoXYZ = function(){
        var tmp_r = red / 255;
        var tmp_g = green / 255;
        var tmp_b = blue / 255;
        if (tmp_r > 0.04045) {
            tmp_r = Math.pow(((tmp_r + 0.055) / 1.055), 2.4);
        } else {
            tmp_r = tmp_r / 12.92;
        }
        if (tmp_g > 0.04045) {
            tmp_g = Math.pow(((tmp_g + 0.055) / 1.055), 2.4);
        } else {
            tmp_g = tmp_g / 12.92;
        }
        if (tmp_b > 0.04045) {
            tmp_b = Math.pow(((tmp_b + 0.055) / 1.055), 2.4);
        } else {
            tmp_b = tmp_b / 12.92;
        }
        tmp_r = tmp_r * 100;
        tmp_g = tmp_g * 100;
        tmp_b = tmp_b * 100;
        var x = tmp_r * 0.4124 + tmp_g * 0.3576 + tmp_b * 0.1805;
        var y = tmp_r * 0.2126 + tmp_g * 0.7152 + tmp_b * 0.0722;
        var z = tmp_r * 0.0193 + tmp_g * 0.1192 + tmp_b * 0.9505;

        xyz_x = x;
        xyz_y = y;
        xyz_z = z;
    }

    var convertXYZtoCIELab = function(){
        var Xn = 95.047;
        var Yn = 100.000;
        var Zn = 108.883;

        var x = xyz_x / Xn;
        var y = xyz_y / Yn;
        var z = xyz_z / Zn;

        if (x > 0.008856) {
            x = Math.pow(x, 1 / 3);
        } else {
            x = (7.787 * x) + (16 / 116);
        }
        if (y > 0.008856) {
            y = Math.pow(y, 1 / 3);
        } else {
            y = (7.787 * y) + (16 / 116);
        }
        if (z > 0.008856) {
            z = Math.pow(z, 1 / 3);
        } else {
            z = (7.787 * z) + (16 / 116);
        }

        if (y > 0.008856) {
            var l = (116 * y) - 16;
        } else {
            var l = 903.3 * y;
        }
        var a = 500 * (x - y);
        var b = 200 * (y - z);

        cielab_l = l;
        cielab_a = a;
        cielab_b = b;
    }

    var convertCIELabToCIELCh = function(){
        var var_H = Math.atan2(cielab_b, cielab_a);

        if (var_H > 0) {
            var_H = (var_H / Math.PI) * 180;
        } else {
            var_H = 360 - (Math.abs(var_H) / Math.PI) * 180
        }

        cielch_l = cielab_l;
        cielch_c = Math.sqrt(Math.pow(cielab_a, 2) + Math.pow(cielab_b, 2));
        
        cielch_h = var_H < 360 ? var_H : (var_H - 360);
    }

    var convertCIELChToCIELab = function(){
        var l = cielch_l;
        var hradi = cielch_h * (Math.PI / 180);
        var a = Math.cos(hradi) * cielch_c;
        var b = Math.sin(hradi) * cielch_c;

        cielab_l = l;
        cielab_a = a;
        cielab_b = b;
    }

    var convertCIELabToXYZ = function(){
        var ref_X = 95.047;
        var ref_Y = 100.000;
        var ref_Z = 108.883;

        var var_Y = (cielab_l + 16) / 116;
        var var_X = cielab_a / 500 + var_Y;
        var var_Z = var_Y - cielab_b / 200;

        if (Math.pow(var_Y, 3) > 0.008856) {
            var_Y = Math.pow(var_Y, 3);
        } else {
            var_Y = (var_Y - 16 / 116) / 7.787;
        }
        if (Math.pow(var_X, 3) > 0.008856) {
            var_X = Math.pow(var_X, 3);
        } else {
            var_X = (var_X - 16 / 116) / 7.787;
        }
        if (Math.pow(var_Z, 3) > 0.008856) {
            var_Z = Math.pow(var_Z, 3);
        } else {
            var_Z = (var_Z - 16 / 116) / 7.787;
        }

        xyz_x = ref_X * var_X;
        xyz_y = ref_Y * var_Y;
        xyz_z = ref_Z * var_Z;
    }

    var convertXYZtoRGB = function(){
        var var_X = xyz_x / 100;
        var var_Y = xyz_y / 100;
        var var_Z = xyz_z / 100;

        var var_R = var_X * 3.2406 + var_Y * -1.5372 + var_Z * -0.4986;
        var var_G = var_X * -0.9689 + var_Y * 1.8758 + var_Z * 0.0415;
        var var_B = var_X * 0.0557 + var_Y * -0.2040 + var_Z * 1.0570;

        if (var_R > 0.0031308) {
            var_R = 1.055 * Math.pow(var_R, (1 / 2.4)) - 0.055;
        } else {
            var_R = 12.92 * var_R;
        }
        if (var_G > 0.0031308) {
            var_G = 1.055 * Math.pow(var_G, (1 / 2.4)) - 0.055;
        } else {
            var_G = 12.92 * var_G;
        }
        if (var_B > 0.0031308) {
            var_B = 1.055 * Math.pow(var_B, (1 / 2.4)) - 0.055;
        } else {
            var_B = 12.92 * var_B;
        }

        red = bound((var_R * 255), 0, 255);
        green = bound((var_G * 255), 0, 255);
        blue = bound((var_B * 255), 0, 255);
    }

    var convertRGBtoCIELCh = function(){
        convertRBGtoXYZ();
        convertXYZtoCIELab();
        convertCIELabToCIELCh();
    }

    var convertCIELChToRGB = function(){
        convertCIELChToCIELab();
        convertCIELabToXYZ();
        convertXYZtoRGB();
    }

    var cleanForRGB = function(){
        if (!rgbDirty) return;

        if (!hsvDirty) {
            convertHSVtoRGB();
        } else if (!cielchDirty) {
            convertCIELChToRGB();
        }
        
        rgbDirty = false;
    }

    var cleanForHSV = function(){
        if (!hsvDirty) return;

        if (!rgbDirty) {
            convertRGBtoHSV();
        } else if (!cielchDirty) {
            convertCIELChToRGB();
            convertRGBtoHSV();
        }
        
        hsvDirty = false;
    }

    var cleanForCIELCh = function(){
        if (!cielchDirty) return;

        if (!hsvDirty) {
            convertHSVtoRGB();
            convertRGBtoCIELCh();
        } else if (!rgbDirty) {
            convertRGBtoCIELCh();
        }

        cielchDirty = false;
    }

    var rgbModified = function(){
        hsvDirty = true;
        cielchDirty = true;
    }

    var hsvModified = function(){
        rgbDirty = true;
        cielchDirty = true;
    }

    var cielchModified = function(){
        rgbDirty = true;
        hsvDirty = true;
    }

    var bound = function(v,l,h){
        return Math.min(h,Math.max(l,v));
    }

    __construct__(r,g,b,mode);
}

var RGBTransition = function(fromColor, toColor, steps){
    var self = this;
    var colors = [];

    var __construct__ = function(fromColor, toColor){
        if (!fromColor) fromColor = new Color();
        if (!toColor) toColor = new Color();

        colors.push(fromColor);

        colors.push(toColor);
    }

    this.getColorAtValue = function(value){
        var fromColor = colors[0];
        var toColor = colors[1];

        var r = fromColor.getRed() + (toColor.getRed() - fromColor.getRed())*value;
        var g = fromColor.getGreen() + (toColor.getGreen() - fromColor.getGreen())*value;
        var b = fromColor.getBlue() + (toColor.getBlue() - fromColor.getBlue())*value;

        return new Color(r, g, b);
    }

    __construct__(fromColor, toColor, steps);
}