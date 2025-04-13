(function ($) {

    // Settings.
    var settings = {
        // Keyboard shortcuts.
        keyboardShortcuts: {
            enabled: true,
            distance: 50
        },

        // Scroll wheel.
        scrollWheel: {
            enabled: true,
            factor: 1
        },

        // Scroll zones.
        scrollZones: {
            enabled: true,
            speed: 15
        },

        // Dragging.
        dragging: {
            enabled: true,
            momentum: 0.875,
            threshold: 10
        },

        excludeSelector: 'input:focus, select:focus, textarea:focus, audio, video, iframe',
        linkScrollSpeed: 1000
    };

    // Vars.
    var $window = $(window),
        $document = $(document),
        $body = $('body'),
        $html = $('html'),
        $bodyHtml = $('body,html'),
        $wrapper = $('#wrapper');

    // Breakpoints.
    breakpoints({
        xlarge: ['1281px', '1680px'],
        large: ['981px', '1280px'],
        medium: ['737px', '980px'],
        small: ['481px', '736px'],
        xsmall: ['361px', '480px'],
        xxsmall: [null, '360px'],
        short: '(min-aspect-ratio: 16/7)',
        xshort: '(min-aspect-ratio: 16/6)'
    });

    // Play initial animations on page load.
    $window.on('load', function () {
        window.setTimeout(function () {
            $body.removeClass('is-preload');
        }, 100);
    });

    // Tweaks/fixes.
    // Mobile: Revert to native scrolling.
    if (browser.mobile) {
        settings.keyboardShortcuts.enabled = false;
        settings.scrollWheel.enabled = false;
        settings.scrollZones.enabled = false;
        settings.dragging.enabled = false;
        $body.css('overflow-x', 'auto');
    }

    // IE: Various fixes.
    if (browser.name == 'ie') {
        $body.addClass('is-ie');
        $window.on('load resize', function () {
            var w = 0;
            $wrapper.children().each(function () {
                w += $(this).width();
            });
            $html.css('width', w + 'px');
        });
    }

    // Polyfill: Object fit.
    if (!browser.canUse('object-fit')) {
        $('.image[data-position]').each(function () {
            var $this = $(this),
                $img = $this.children('img');
            $this.css('background-image', 'url("' + $img.attr('src') + '")')
                .css('background-position', $this.data('position'))
                .css('background-size', 'cover')
                .css('background-repeat', 'no-repeat');
            $img.css('opacity', '0');
        });
    }

    // Keyboard shortcuts.
    if (settings.keyboardShortcuts.enabled)
        (function () {
            $wrapper.on('keypress keyup keydown', settings.excludeSelector, function (event) {
                event.stopPropagation();
            });

            $window.on('keydown', function (event) {
                var scrolled = false;
                switch (event.keyCode) {
                    case 37:
                        $document.scrollLeft($document.scrollLeft() - settings.keyboardShortcuts.distance);
                        scrolled = true;
                        break;
                    case 39:
                        $document.scrollLeft($document.scrollLeft() + settings.keyboardShortcuts.distance);
                        scrolled = true;
                        break;
                    case 33:
                        $document.scrollLeft($document.scrollLeft() - $window.width() + 100);
                        scrolled = true;
                        break;
                    case 34:
                    case 32:
                        $document.scrollLeft($document.scrollLeft() + $window.width() - 100);
                        scrolled = true;
                        break;
                    case 36:
                        $document.scrollLeft(0);
                        scrolled = true;
                        break;
                    case 35:
                        $document.scrollLeft($document.width());
                        scrolled = true;
                        break;
                }
                if (scrolled) {
                    event.preventDefault();
                    event.stopPropagation();
                    $bodyHtml.stop();
                }
            });
        })();

    // Scroll wheel.
    if (settings.scrollWheel.enabled)
        (function () {
            var normalizeWheel = function (event) {
                var pixelStep = 10,
                    lineHeight = 40,
                    pageHeight = 800,
                    sX = 0,
                    sY = 0,
                    pX = 0,
                    pY = 0;

                if ('detail' in event)
                    sY = event.detail;
                else if ('wheelDelta' in event)
                    sY = event.wheelDelta / -120;
                else if ('wheelDeltaY' in event)
                    sY = event.wheelDeltaY / -120;

                if ('wheelDeltaX' in event)
                    sX = event.wheelDeltaX / -120;

                if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
                    sX = sY;
                    sY = 0;
                }

                pX = sX * pixelStep;
                pY = sY * pixelStep;

                if ('deltaY' in event)
                    pY = event.deltaY;

                if ('deltaX' in event)
                    pX = event.deltaX;

                if ((pX || pY) && event.deltaMode) {
                    if (event.deltaMode == 1) {
                        pX *= lineHeight;
                        pY *= lineHeight;
                    }
                    else {
                        pX *= pageHeight;
                        pY *= pageHeight;
                    }
                }

                if (pX && !sX)
                    sX = (pX < 1) ? -1 : 1;

                if (pY && !sY)
                    sY = (pY < 1) ? -1 : 1;

                return {
                    spinX: sX,
                    spinY: sY,
                    pixelX: pX,
                    pixelY: pY
                };
            };

            $body.on('wheel', function (event) {
                if (breakpoints.active('<=small'))
                    return;

                event.preventDefault();
                event.stopPropagation();
                $bodyHtml.stop();

                var n = normalizeWheel(event.originalEvent),
                    x = (n.pixelX != 0 ? n.pixelX : n.pixelY),
                    delta = Math.min(Math.abs(x), 150) * settings.scrollWheel.factor,
                    direction = x > 0 ? 1 : -1;

                $document.scrollLeft($document.scrollLeft() + (delta * direction));
            });
        })();

    // Scroll zones.
    if (settings.scrollZones.enabled)
        (function () {
            var $left = $('<div class="scrollZone left"></div>'),
                $right = $('<div class="scrollZone right"></div>'),
                $zones = $left.add($right),
                paused = false,
                intervalId = null,
                direction,
                activate = function (d) {
                    if (breakpoints.active('<=small'))
                        return;

                    if (paused)
                        return;

                    $bodyHtml.stop();

                    direction = d;

                    clearInterval(intervalId);
                    intervalId = setInterval(function () {
                        $document.scrollLeft($document.scrollLeft() + (settings.scrollZones.speed * direction));
                    }, 25);
                },
                deactivate = function () {
                    paused = false;
                    clearInterval(intervalId);
                };

            $zones.appendTo($wrapper)
                .on('mouseleave mousedown', function (event) {
                    deactivate();
                });

            $left.css('left', '0')
                .on('mouseenter', function (event) {
                    activate(-1);
                });

            $right.css('right', '0')
                .on('mouseenter', function (event) {
                    activate(1);
                });

            $wrapper.on('---pauseScrollZone', function (event) {
                paused = true;
                setTimeout(function () {
                    paused = false;
                }, 500);
            });
        })();

    // Dragging.
    if (settings.dragging.enabled)
        (function () {
            var dragging = false,
                dragged = false,
                distance = 0,
                startScroll,
                momentumIntervalId, velocityIntervalId,
                startX, currentX, previousX,
                velocity, direction;

            $wrapper
                .on('mouseup mousemove mousedown', '.image, img', function (event) {
                    event.preventDefault();
                })
                .on('mouseup mousemove mousedown', settings.excludeSelector, function (event) {
                    event.stopPropagation();
                    dragging = false;
                    $wrapper.removeClass('is-dragging');
                    clearInterval(velocityIntervalId);
                    clearInterval(momentumIntervalId);
                    $wrapper.triggerHandler('---pauseScrollZone');
                })
                .on('mousedown', function (event) {
                    if (breakpoints.active('<=small'))
                        return;

                    clearInterval(momentumIntervalId);
                    $bodyHtml.stop();
                    dragging = true;
                    $wrapper.addClass('is-dragging');

                    startScroll = $document.scrollLeft();
                    startX = event.clientX;
                    previousX = startX;
                    currentX = startX;
                    distance = 0;
                    direction = 0;

                    clearInterval(velocityIntervalId);

                    velocityIntervalId = setInterval(function () {
                        velocity = Math.abs(currentX - previousX);
                        direction = (currentX > previousX ? -1 : 1);
                        previousX = currentX;
                    }, 50);
                })
                .on('mousemove', function (event) {
                    if (!dragging)
                        return;

                    currentX = event.clientX;
                    $document.scrollLeft(startScroll + (startX - currentX));

                    distance = Math.abs(startScroll - $document.scrollLeft());

                    if (!dragged && distance > settings.dragging.threshold) {
                        $wrapper.addClass('is-dragged');
                        dragged = true;
                    }
                })
                .on('mouseup mouseleave', function (event) {
                    var m;
                    if (!dragging)
                        return;

                    if (dragged) {
                        setTimeout(function () {
                            $wrapper.removeClass('is-dragged');
                        }, 100);
                        dragged = false;
                    }

                    if (distance > settings.dragging.threshold)
                        event.preventDefault();

                    dragging = false;
                    $wrapper.removeClass('is-dragging');
                    clearInterval(velocityIntervalId);
                    clearInterval(momentumIntervalId);
                    $wrapper.triggerHandler('---pauseScrollZone');

                    if (settings.dragging.momentum > 0) {
                        m = velocity;
                        momentumIntervalId = setInterval(function () {
                            if (isNaN(m)) {
                                clearInterval(momentumIntervalId);
                                return;
                            }
                            $document.scrollLeft($document.scrollLeft() + (m * direction));
                            m = m * settings.dragging.momentum;
                            if (Math.abs(m) < 1)
                                clearInterval(momentumIntervalId);
                        }, 15);
                    }
                });
        })();

    // Lazy loading for gallery images.
    $(function () {
        var lazyImages = document.querySelectorAll('img.lazy');

        var observer = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(function (image) {
            observer.observe(image);
        });
    });

})(jQuery);
