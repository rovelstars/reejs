(function(window, document) {
    window.device = {};

    // Browser type
    device.browser = {
      msie: (function() {
        return (/msie/i).test(navigator.userAgent);
      })()
    };

    // Screen size
    device.screen = window.screen;

    // Browser size
    device.viewport = {
        height: window.innerHeight,
        width: window.innerWidth
    };

    // Mobile device
    device.mobile = (/mobile/i).test(navigator.userAgent);

    // Make it available
    window.device = device;

    if (window.addEventListener) {
      window.on = window.addEventListener;
    } else {
      window.on =  window.attachEvent;
    }

    window.addEventListener('resize', function(e) {
        device.viewport = {
          height: window.innerHeight,
          width: window.innerWidth
        };
        console.log("Window was resized!");
    });
})(window, document);