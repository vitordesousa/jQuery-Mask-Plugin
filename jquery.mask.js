 /**
 * jquery.mask.js
 * @version: v0.5.1 
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at http://blog.igorescobar.com
 *
 * Copyright (c) 2012 Igor Escobar http://blog.igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

(function($) {
  "use strict";

  var  e, oValue, oNewValue, keyCode, pMask;

  var Mask = function(el, mask, options) {
    var plugin = this,
        $el = $(el),
        defaults = {
        byPassKeys: [8,9,37,38,39,40],
        specialChars: {':': 191, '-': 189, '.': 190, '(': 57, ')': 48, '/': 191, ',': 188, '_': 189, ' ': 32, '+': 187},
        translation: { 0: '(.)', 1: '(.)', 2: '(.)', 3: '(.)', 4: '(.)', 5: '(.)', 6: '(.)', 7: '(.)', 8: '(.)', 9: '(.)', 
                      'A': '(.)', 'S': '(.)',':': '(:)?', '-': '(-)?', '.': '(\\\.)?', '(': '(\\()?', ')': '(\\))?', '/': '(/)?', 
                      ',': '(,)?', '_': '(_)?', ' ': '(\\s)?', '+': '(\\\+)?'}};
        

    plugin.settings = {};
    plugin.init = function(){
      plugin.settings = $.extend({}, defaults, options);
        
      options = options || {};
      $el.each(function() {
        mask = resolveDynamicMask(mask, $(this).val(), e, $(this), options);
        $el.attr('maxlength', mask.length);
        $el.attr('autocomplete', 'off');

        destroyEvents();
        setOnKeyUp();
        setOnPaste();    
      });
    };

    // public methods
    plugin.remove = function() {
      destroyEvents();
      $el.val(onlyNumbers($el.val()));
    };

    // private methods
    var resolveDynamicMask = function(mask, oValue, e, currentField, options){
      return typeof mask == "function" ? mask(oValue, e, currentField, options) : mask;
    };

    var onlyNumbers = function(string) {
      return string.replace(/\W/g, '');
    };

    var onPasteMethod = function(){
      setTimeout(function(){
        $el.trigger('keyup');
      }, 100);
    };

    var setOnPaste = function() {
      (hasOnSupport()) ? $el.on("paste", onPasteMethod) : $el.onpaste = onPasteMethod;
    };

    var setOnKeyUp = function(){
      $el.keyup(maskBehaviour).trigger('keyup');
    };

    var hasOnSupport = function() {
      return $.isFunction($.on);
    };

    var destroyEvents = function(){
      $el.unbind('keyup').unbind('onpaste');
    };

    var maskBehaviour = function(e){
      e = e || window.event;
      keyCode = e.keyCode || e.which;

      if ($.inArray(keyCode, plugin.settings.byPassKeys) >= 0) 
        return true;

      var oCleanedValue = onlyNumbers($el.val());

      pMask = (typeof options.reverse == "boolean" && options.reverse === true) ?
      getProportionalReverseMask(oCleanedValue, mask) :
      getProportionalMask(oCleanedValue, mask);

      oNewValue = applyMask(e, $el, pMask, options);

      if (oNewValue !== $el.val()){
        // workaround to trigger the change Event when setted
        $el.val(oNewValue).trigger('change');
      }
        
      return seekCallbacks(e, options, oNewValue, mask, $el);
    };

    var applyMask = function (e, fieldObject, mask, options) {

      oValue = onlyNumbers(fieldObject.val()).substring(0, onlyNumbers(mask).length);

      return oValue.replace(new RegExp(maskToRegex(mask)), function(){
        oNewValue = '';
        for (var i = 1; i < arguments.length - 2; i++) {
          if (typeof arguments[i] == "undefined" || arguments[i] === ""){
            arguments[i] = mask.charAt(i-1);
          }

          oNewValue += arguments[i];
        }

        return cleanBullShit(oNewValue, mask);
      });
    };

    var getProportionalMask = function (oValue, mask) {
      var endMask = 0, m = 0;

      while (m <= oValue.length-1){
        while(typeof plugin.settings.specialChars[mask.charAt(endMask)] === "number")
          endMask++;
        endMask++;
        m++;
      }

      return mask.substring(0, endMask);
    };

    var getProportionalReverseMask = function (oValue, mask) {
      var startMask = 0, endMask = 0, m = 0;
      startMask = (mask.length >= 1) ? mask.length : mask.length-1;
      endMask = startMask;

      while (m <= oValue.length-1) {
        while (typeof plugin.settings.specialChars[mask.charAt(endMask-1)] === "number")
          endMask--;
        endMask--;
        m++;
      }

      endMask = (mask.length >= 1) ? endMask : endMask-1;
      return mask.substring(startMask, endMask);
    };

    var maskToRegex = function (mask) {
      var regex = '';
      for (var i = 0; i < mask.length; i ++){
        if (plugin.settings.translation[mask.charAt(i)])
          regex += plugin.settings.translation[mask.charAt(i)];
      }
      return regex;
    };

    var validDigit = function (nowMask, nowDigit) {
      if (isNaN(parseInt(nowMask, 10)) === false && /\d/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'A' && /[a-zA-Z0-9]/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'S' && /[a-zA-Z]/.test(nowDigit) === false) {
        return false;
      } else if (typeof plugin.settings.specialChars[nowDigit] === "number" && nowMask !== nowDigit) {
        return false;
      }
      return true;
    };

    var cleanBullShit = function (oNewValue, mask) {
      oNewValue = oNewValue.split('');
      for(var i = 0; i < mask.length; i++){
        if(validDigit(mask.charAt(i), oNewValue[i]) === false)
          oNewValue[i] = '';
      }
      return oNewValue.join('');
    };

    var seekCallbacks = function (e, options, oNewValue, mask, currentField) {
      if (options.onKeyPress && e.isTrigger === undefined && typeof options.onKeyPress == "function") {
        options.onKeyPress(oNewValue, e, currentField, options);
      }

      if (options.onComplete && e.isTrigger === undefined &&
          oNewValue.length === mask.length && typeof options.onComplete == "function") {
        options.onComplete(oNewValue, e, currentField, options);
      }
    };

    plugin.init();
  };

  $.fn.mask = function(mask, options) {
    return this.each(function() {
      $(this).data('mask', new Mask(this, mask, options));
    });
  };

})(jQuery); /**
 * jquery.mask.js
   v0.5.0+3
 
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at http://blog.igorescobar.com
 *
 * Copyright (c) 2012 Igor Escobar http://blog.igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

(function($) {
  "use strict";

  var  e, oValue, oNewValue, keyCode, pMask;

  var Mask = function(el, mask, options) {
    var plugin = this,
        $el = $(el),
        defaults = {
        byPassKeys: [8,9,37,38,39,40],
        specialChars: {':': 191, '-': 189, '.': 190, '(': 57, ')': 48, '/': 191, ',': 188, '_': 189, ' ': 32, '+': 187},
        translation: { 0: '(.)', 1: '(.)', 2: '(.)', 3: '(.)', 4: '(.)', 5: '(.)', 6: '(.)', 7: '(.)', 8: '(.)', 9: '(.)', 
                      'A': '(.)', 'S': '(.)',':': '(:)?', '-': '(-)?', '.': '(\\\.)?', '(': '(\\()?', ')': '(\\))?', '/': '(/)?', 
                      ',': '(,)?', '_': '(_)?', ' ': '(\\s)?', '+': '(\\\+)?'}};
        

    plugin.settings = {};
    plugin.init = function(){
      plugin.settings = $.extend({}, defaults, options);
        
      options = options || {};
      $el.each(function() {
        mask = resolveDynamicMask(mask, $(this).val(), e, $(this), options);
        $el.attr('maxlength', mask.length);
        $el.attr('autocomplete', 'off');

        destroyEvents();
        setOnKeyUp();
        setOnPaste();    
      });
    };

    // public methods
    plugin.remove = function() {
      destroyEvents();
      $el.val(onlyNumbers($el.val()));
    };

    // private methods
    var resolveDynamicMask = function(mask, oValue, e, currentField, options){
      return typeof mask == "function" ? mask(oValue, e, currentField, options) : mask;
    };

    var onlyNumbers = function(string) {
      return string.replace(/\W/g, '');
    };

    var onPasteMethod = function(){
      setTimeout(function(){
        $el.trigger('keyup');
      }, 100);
    };

    var setOnPaste = function() {
      (hasOnSupport()) ? $el.on("paste", onPasteMethod) : $el.onpaste = onPasteMethod;
    };

    var setOnKeyUp = function(){
      $el.keyup(maskBehaviour).trigger('keyup');
    };

    var hasOnSupport = function() {
      return $.isFunction($.on);
    };

    var destroyEvents = function(){
      $el.unbind('keyup').unbind('onpaste');
    };

    var maskBehaviour = function(e){
      e = e || window.event;
      keyCode = e.keyCode || e.which;

      if ($.inArray(keyCode, plugin.settings.byPassKeys) >= 0) 
        return true;

      var oCleanedValue = onlyNumbers($el.val());

      pMask = (typeof options.reverse == "boolean" && options.reverse === true) ?
      getProportionalReverseMask(oCleanedValue, mask) :
      getProportionalMask(oCleanedValue, mask);

      oNewValue = applyMask(e, $el, pMask, options);

      if (oNewValue !== $el.val()){
        // workaround to trigger the change Event when setted
        $el.val(oNewValue).trigger('change');
      }
        
      return seekCallbacks(e, options, oNewValue, mask, $el);
    };

    var applyMask = function (e, fieldObject, mask, options) {

      oValue = onlyNumbers(fieldObject.val()).substring(0, onlyNumbers(mask).length);

      return oValue.replace(new RegExp(maskToRegex(mask)), function(){
        oNewValue = '';
        for (var i = 1; i < arguments.length - 2; i++) {
          if (typeof arguments[i] == "undefined" || arguments[i] === ""){
            arguments[i] = mask.charAt(i-1);
          }

          oNewValue += arguments[i];
        }

        return cleanBullShit(oNewValue, mask);
      });
    };

    var getProportionalMask = function (oValue, mask) {
      var endMask = 0, m = 0;

      while (m <= oValue.length-1){
        while(typeof plugin.settings.specialChars[mask.charAt(endMask)] === "number")
          endMask++;
        endMask++;
        m++;
      }

      return mask.substring(0, endMask);
    };

    var getProportionalReverseMask = function (oValue, mask) {
      var startMask = 0, endMask = 0, m = 0;
      startMask = (mask.length >= 1) ? mask.length : mask.length-1;
      endMask = startMask;

      while (m <= oValue.length-1) {
        while (typeof plugin.settings.specialChars[mask.charAt(endMask-1)] === "number")
          endMask--;
        endMask--;
        m++;
      }

      endMask = (mask.length >= 1) ? endMask : endMask-1;
      return mask.substring(startMask, endMask);
    };

    var maskToRegex = function (mask) {
      var regex = '';
      for (var i = 0; i < mask.length; i ++){
        if (plugin.settings.translation[mask.charAt(i)])
          regex += plugin.settings.translation[mask.charAt(i)];
      }
      return regex;
    };

    var validDigit = function (nowMask, nowDigit) {
      if (isNaN(parseInt(nowMask, 10)) === false && /\d/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'A' && /[a-zA-Z0-9]/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'S' && /[a-zA-Z]/.test(nowDigit) === false) {
        return false;
      } else if (typeof plugin.settings.specialChars[nowDigit] === "number" && nowMask !== nowDigit) {
        return false;
      }
      return true;
    };

    var cleanBullShit = function (oNewValue, mask) {
      oNewValue = oNewValue.split('');
      for(var i = 0; i < mask.length; i++){
        if(validDigit(mask.charAt(i), oNewValue[i]) === false)
          oNewValue[i] = '';
      }
      return oNewValue.join('');
    };

    var seekCallbacks = function (e, options, oNewValue, mask, currentField) {
      if (options.onKeyPress && e.isTrigger === undefined && typeof options.onKeyPress == "function") {
        options.onKeyPress(oNewValue, e, currentField, options);
      }

      if (options.onComplete && e.isTrigger === undefined &&
          oNewValue.length === mask.length && typeof options.onComplete == "function") {
        options.onComplete(oNewValue, e, currentField, options);
      }
    };

    plugin.init();
  };

  $.fn.mask = function(mask, options) {
    return this.each(function() {
      $(this).data('mask', new Mask(this, mask, options));
    });
  };

})(jQuery); /**
 * jquery.mask.js
 $0 v0.5.0+3
 
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at http://blog.igorescobar.com
 *
 * Copyright (c) 2012 Igor Escobar http://blog.igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

(function($) {
  "use strict";

  var  e, oValue, oNewValue, keyCode, pMask;

  var Mask = function(el, mask, options) {
    var plugin = this,
        $el = $(el),
        defaults = {
        byPassKeys: [8,9,37,38,39,40],
        specialChars: {':': 191, '-': 189, '.': 190, '(': 57, ')': 48, '/': 191, ',': 188, '_': 189, ' ': 32, '+': 187},
        translation: { 0: '(.)', 1: '(.)', 2: '(.)', 3: '(.)', 4: '(.)', 5: '(.)', 6: '(.)', 7: '(.)', 8: '(.)', 9: '(.)', 
                      'A': '(.)', 'S': '(.)',':': '(:)?', '-': '(-)?', '.': '(\\\.)?', '(': '(\\()?', ')': '(\\))?', '/': '(/)?', 
                      ',': '(,)?', '_': '(_)?', ' ': '(\\s)?', '+': '(\\\+)?'}};
        

    plugin.settings = {};
    plugin.init = function(){
      plugin.settings = $.extend({}, defaults, options);
        
      options = options || {};
      $el.each(function() {
        mask = resolveDynamicMask(mask, $(this).val(), e, $(this), options);
        $el.attr('maxlength', mask.length);
        $el.attr('autocomplete', 'off');

        destroyEvents();
        setOnKeyUp();
        setOnPaste();    
      });
    };

    // public methods
    plugin.remove = function() {
      destroyEvents();
      $el.val(onlyNumbers($el.val()));
    };

    // private methods
    var resolveDynamicMask = function(mask, oValue, e, currentField, options){
      return typeof mask == "function" ? mask(oValue, e, currentField, options) : mask;
    };

    var onlyNumbers = function(string) {
      return string.replace(/\W/g, '');
    };

    var onPasteMethod = function(){
      setTimeout(function(){
        $el.trigger('keyup');
      }, 100);
    };

    var setOnPaste = function() {
      (hasOnSupport()) ? $el.on("paste", onPasteMethod) : $el.onpaste = onPasteMethod;
    };

    var setOnKeyUp = function(){
      $el.keyup(maskBehaviour).trigger('keyup');
    };

    var hasOnSupport = function() {
      return $.isFunction($.on);
    };

    var destroyEvents = function(){
      $el.unbind('keyup').unbind('onpaste');
    };

    var maskBehaviour = function(e){
      e = e || window.event;
      keyCode = e.keyCode || e.which;

      if ($.inArray(keyCode, plugin.settings.byPassKeys) >= 0) 
        return true;

      var oCleanedValue = onlyNumbers($el.val());

      pMask = (typeof options.reverse == "boolean" && options.reverse === true) ?
      getProportionalReverseMask(oCleanedValue, mask) :
      getProportionalMask(oCleanedValue, mask);

      oNewValue = applyMask(e, $el, pMask, options);

      if (oNewValue !== $el.val()){
        // workaround to trigger the change Event when setted
        $el.val(oNewValue).trigger('change');
      }
        
      return seekCallbacks(e, options, oNewValue, mask, $el);
    };

    var applyMask = function (e, fieldObject, mask, options) {

      oValue = onlyNumbers(fieldObject.val()).substring(0, onlyNumbers(mask).length);

      return oValue.replace(new RegExp(maskToRegex(mask)), function(){
        oNewValue = '';
        for (var i = 1; i < arguments.length - 2; i++) {
          if (typeof arguments[i] == "undefined" || arguments[i] === ""){
            arguments[i] = mask.charAt(i-1);
          }

          oNewValue += arguments[i];
        }

        return cleanBullShit(oNewValue, mask);
      });
    };

    var getProportionalMask = function (oValue, mask) {
      var endMask = 0, m = 0;

      while (m <= oValue.length-1){
        while(typeof plugin.settings.specialChars[mask.charAt(endMask)] === "number")
          endMask++;
        endMask++;
        m++;
      }

      return mask.substring(0, endMask);
    };

    var getProportionalReverseMask = function (oValue, mask) {
      var startMask = 0, endMask = 0, m = 0;
      startMask = (mask.length >= 1) ? mask.length : mask.length-1;
      endMask = startMask;

      while (m <= oValue.length-1) {
        while (typeof plugin.settings.specialChars[mask.charAt(endMask-1)] === "number")
          endMask--;
        endMask--;
        m++;
      }

      endMask = (mask.length >= 1) ? endMask : endMask-1;
      return mask.substring(startMask, endMask);
    };

    var maskToRegex = function (mask) {
      var regex = '';
      for (var i = 0; i < mask.length; i ++){
        if (plugin.settings.translation[mask.charAt(i)])
          regex += plugin.settings.translation[mask.charAt(i)];
      }
      return regex;
    };

    var validDigit = function (nowMask, nowDigit) {
      if (isNaN(parseInt(nowMask, 10)) === false && /\d/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'A' && /[a-zA-Z0-9]/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'S' && /[a-zA-Z]/.test(nowDigit) === false) {
        return false;
      } else if (typeof plugin.settings.specialChars[nowDigit] === "number" && nowMask !== nowDigit) {
        return false;
      }
      return true;
    };

    var cleanBullShit = function (oNewValue, mask) {
      oNewValue = oNewValue.split('');
      for(var i = 0; i < mask.length; i++){
        if(validDigit(mask.charAt(i), oNewValue[i]) === false)
          oNewValue[i] = '';
      }
      return oNewValue.join('');
    };

    var seekCallbacks = function (e, options, oNewValue, mask, currentField) {
      if (options.onKeyPress && e.isTrigger === undefined && typeof options.onKeyPress == "function") {
        options.onKeyPress(oNewValue, e, currentField, options);
      }

      if (options.onComplete && e.isTrigger === undefined &&
          oNewValue.length === mask.length && typeof options.onComplete == "function") {
        options.onComplete(oNewValue, e, currentField, options);
      }
    };

    plugin.init();
  };

  $.fn.mask = function(mask, options) {
    return this.each(function() {
      $(this).data('mask', new Mask(this, mask, options));
    });
  };

})(jQuery); /**
 * jquery.mask.js
   v0.5.0+3
 
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at http://blog.igorescobar.com
 *
 * Copyright (c) 2012 Igor Escobar http://blog.igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

(function($) {
  "use strict";

  var  e, oValue, oNewValue, keyCode, pMask;

  var Mask = function(el, mask, options) {
    var plugin = this,
        $el = $(el),
        defaults = {
        byPassKeys: [8,9,37,38,39,40],
        specialChars: {':': 191, '-': 189, '.': 190, '(': 57, ')': 48, '/': 191, ',': 188, '_': 189, ' ': 32, '+': 187},
        translation: { 0: '(.)', 1: '(.)', 2: '(.)', 3: '(.)', 4: '(.)', 5: '(.)', 6: '(.)', 7: '(.)', 8: '(.)', 9: '(.)', 
                      'A': '(.)', 'S': '(.)',':': '(:)?', '-': '(-)?', '.': '(\\\.)?', '(': '(\\()?', ')': '(\\))?', '/': '(/)?', 
                      ',': '(,)?', '_': '(_)?', ' ': '(\\s)?', '+': '(\\\+)?'}};
        

    plugin.settings = {};
    plugin.init = function(){
      plugin.settings = $.extend({}, defaults, options);
        
      options = options || {};
      $el.each(function() {
        mask = resolveDynamicMask(mask, $(this).val(), e, $(this), options);
        $el.attr('maxlength', mask.length);
        $el.attr('autocomplete', 'off');

        destroyEvents();
        setOnKeyUp();
        setOnPaste();    
      });
    };

    // public methods
    plugin.remove = function() {
      destroyEvents();
      $el.val(onlyNumbers($el.val()));
    };

    // private methods
    var resolveDynamicMask = function(mask, oValue, e, currentField, options){
      return typeof mask == "function" ? mask(oValue, e, currentField, options) : mask;
    };

    var onlyNumbers = function(string) {
      return string.replace(/\W/g, '');
    };

    var onPasteMethod = function(){
      setTimeout(function(){
        $el.trigger('keyup');
      }, 100);
    };

    var setOnPaste = function() {
      (hasOnSupport()) ? $el.on("paste", onPasteMethod) : $el.onpaste = onPasteMethod;
    };

    var setOnKeyUp = function(){
      $el.keyup(maskBehaviour).trigger('keyup');
    };

    var hasOnSupport = function() {
      return $.isFunction($.on);
    };

    var destroyEvents = function(){
      $el.unbind('keyup').unbind('onpaste');
    };

    var maskBehaviour = function(e){
      e = e || window.event;
      keyCode = e.keyCode || e.which;

      if ($.inArray(keyCode, plugin.settings.byPassKeys) >= 0) 
        return true;

      var oCleanedValue = onlyNumbers($el.val());

      pMask = (typeof options.reverse == "boolean" && options.reverse === true) ?
      getProportionalReverseMask(oCleanedValue, mask) :
      getProportionalMask(oCleanedValue, mask);

      oNewValue = applyMask(e, $el, pMask, options);

      if (oNewValue !== $el.val()){
        // workaround to trigger the change Event when setted
        $el.val(oNewValue).trigger('change');
      }
        
      return seekCallbacks(e, options, oNewValue, mask, $el);
    };

    var applyMask = function (e, fieldObject, mask, options) {

      oValue = onlyNumbers(fieldObject.val()).substring(0, onlyNumbers(mask).length);

      return oValue.replace(new RegExp(maskToRegex(mask)), function(){
        oNewValue = '';
        for (var i = 1; i < arguments.length - 2; i++) {
          if (typeof arguments[i] == "undefined" || arguments[i] === ""){
            arguments[i] = mask.charAt(i-1);
          }

          oNewValue += arguments[i];
        }

        return cleanBullShit(oNewValue, mask);
      });
    };

    var getProportionalMask = function (oValue, mask) {
      var endMask = 0, m = 0;

      while (m <= oValue.length-1){
        while(typeof plugin.settings.specialChars[mask.charAt(endMask)] === "number")
          endMask++;
        endMask++;
        m++;
      }

      return mask.substring(0, endMask);
    };

    var getProportionalReverseMask = function (oValue, mask) {
      var startMask = 0, endMask = 0, m = 0;
      startMask = (mask.length >= 1) ? mask.length : mask.length-1;
      endMask = startMask;

      while (m <= oValue.length-1) {
        while (typeof plugin.settings.specialChars[mask.charAt(endMask-1)] === "number")
          endMask--;
        endMask--;
        m++;
      }

      endMask = (mask.length >= 1) ? endMask : endMask-1;
      return mask.substring(startMask, endMask);
    };

    var maskToRegex = function (mask) {
      var regex = '';
      for (var i = 0; i < mask.length; i ++){
        if (plugin.settings.translation[mask.charAt(i)])
          regex += plugin.settings.translation[mask.charAt(i)];
      }
      return regex;
    };

    var validDigit = function (nowMask, nowDigit) {
      if (isNaN(parseInt(nowMask, 10)) === false && /\d/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'A' && /[a-zA-Z0-9]/.test(nowDigit) === false) {
        return false;
      } else if (nowMask === 'S' && /[a-zA-Z]/.test(nowDigit) === false) {
        return false;
      } else if (typeof plugin.settings.specialChars[nowDigit] === "number" && nowMask !== nowDigit) {
        return false;
      }
      return true;
    };

    var cleanBullShit = function (oNewValue, mask) {
      oNewValue = oNewValue.split('');
      for(var i = 0; i < mask.length; i++){
        if(validDigit(mask.charAt(i), oNewValue[i]) === false)
          oNewValue[i] = '';
      }
      return oNewValue.join('');
    };

    var seekCallbacks = function (e, options, oNewValue, mask, currentField) {
      if (options.onKeyPress && e.isTrigger === undefined && typeof options.onKeyPress == "function") {
        options.onKeyPress(oNewValue, e, currentField, options);
      }

      if (options.onComplete && e.isTrigger === undefined &&
          oNewValue.length === mask.length && typeof options.onComplete == "function") {
        options.onComplete(oNewValue, e, currentField, options);
      }
    };

    plugin.init();
  };

  $.fn.mask = function(mask, options) {
    return this.each(function() {
      $(this).data('mask', new Mask(this, mask, options));
    });
  };

})(jQuery);