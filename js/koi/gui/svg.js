/**
 * SVG element creation functions
 */
const SVG = {
    URI: document.getElementsByTagName("svg")[0].getAttribute("xmlns"),
    /**
     * Create a SVG element
     * @returns {SVGSVGElement} An SVG element
     */
    createElement: function() {
        return document.createElementNS(SVG.URI, "svg");
    },
    /**
     * Create a SVG defs element
     * @returns {SVGDefsElement} The defs element
     */
    createDefs: function() {
        return document.createElementNS(SVG.URI, "defs");
    },
    /**
     * Create a pattern element
     * @returns {SVGPatternElement} The pattern element
     */
    createPattern: function() {
        const element = document.createElementNS(SVG.URI, "pattern");

        element.setAttribute("width", "100%");
        element.setAttribute("height", "100%");

        return element;
    },
    /**
     * Create a mask
     * @returns {SVGMaskElement} The mask element
     */
    createMask: function() {
        return document.createElementNS(SVG.URI, "mask");
    },
    /**
     * Set the mask for an SVG element
     * @param {SVGElement} element The SVG element
     * @param {String} id The ID name of the mask
     */
    setMask: function(element, id) {
        element.setAttribute("mask", "url(#" + id + ")");
    },
    /**
     * Set the fill for an SVG element
     * @param {SVGElement} element The SVG element
     * @param {String} id The ID name of the fill
     */
    setFill: function(element, id) {
        element.setAttribute("fill", "url(#" + id + ")");
    },
    /**
     * Set the view box of an existing SVG element
     * @param {SVGSVGElement} element An SVG element
     * @param {Number} left The left position of the view box
     * @param {Number} top The top position of the view box
     * @param {Number} width The width of the view box
     * @param {Number} height The height of the view box
     */
    setViewBox: function(element, left, top, width, height) {
        element.setAttribute("viewBox",
            left.toString() + " " +
            top.toString() + " " +
            width.toString() + " " +
            height.toString());
    },
    /**
     * Set the transform of an element
     * @param {SVGElement} element An SVG element
     * @param {Number} x The X position
     * @param {Number} y The Y position
     */
    setTransform: function(element, x, y) {
        element.setAttribute("transform", "translate(" + x.toString() + " " + y.toString() + ")");
    },
    /**
     * Set the pattern of an element
     * @param {SVGElement} element The element
     * @param {String} pattern The pattern ID
     */
    setPattern: function(element, pattern) {
        element.setAttribute("fill", "url(#" + pattern + ")");
    },
    /**
     * Set the preserve aspect ratio value
     * @param {SVGElement} element The element to set the aspect ratio behavior for
     * @param {String} value The value
     */
    setPreserveAspectRatio: function(element, value) {
        element.setAttribute("preserveAspectRatio", value);
    },
    /**
     * Create a linear gradient
     * @param {Number[]} stopPositions An array of stop positions in the range [0, 1]
     * @param {Color[]} stopColors An array of stop colors
     * @returns {SVGLinearGradientElement} The linear gradient element
     */
    createHorizontalGradient: function(stopPositions, stopColors) {
        const element = document.createElementNS(SVG.URI, "linearGradient");

        for (let stop = 0, stops = stopPositions.length; stop < stops; ++stop) {
            const stopElement = document.createElementNS(SVG.URI, "stop");

            stopElement.setAttribute(
                "offset",
                (100 * stopPositions[stop]).toFixed(2) + "%");
            stopElement.setAttribute(
                "style",
                "stop-color:" + stopColors[stop].toHex());

            element.appendChild(stopElement);
        }

        return element;
    },
    /**
     * Set the ID of a SVG element
     * @param {SVGElement} element The SVG element
     * @param {String} id The ID
     */
    setId: function(element, id) {
        element.setAttribute("id", id);
    },
    /**
     * Set the class name of a SVG element
     * @param {SVGElement} element The SVG element
     * @param {String} className The class name
     */
    setClass: function(element, className) {
        element.setAttribute("class", className);
    },
    /**
     * Create a group
     * @returns {SVGGElement} The group element
     */
    createGroup: function() {
        return document.createElementNS(SVG.URI, "g");
    },
    /**
     * Create a path
     * @param {(Number|String)[]}commands An array of commands, which may be strings or numbers
     * @returns {SVGPathElement} The path element
     */
    createPath: function(commands) {
        const element = document.createElementNS(SVG.URI, "path");
        let pathString = "";

        for (const command of commands)
            if (typeof command === "number") {
                if (command === (command | 0))
                    pathString += command + " ";
                else
                    pathString += command.toFixed(2) + " ";
            }
            else
                pathString += command;

        element.setAttributeNS(null, "d", pathString);

        return element;
    },
    /**
     * Create a circle
     * @param {Number} x The X position
     * @param {Number} y The Y position
     * @param {Number} radius The radius
     * @returns {SVGCircleElement} The circle element
     */
    createCircle: function (x, y, radius) {
        const element = document.createElementNS(SVG.URI, "circle");

        element.setAttribute("cx", x.toString());
        element.setAttribute("cy", y.toString());
        element.setAttribute("r", radius.toString());

        return element;
    },
    /**
     * Create a rectangle
     * @param {Number} x The X position
     * @param {Number} y The Y position
     * @param {Number} width The width
     * @param {Number} height The height
     * @returns {SVGRectElement} The rectangle
     */
    createRect: function(x, y, width, height) {
        const element = document.createElementNS(SVG.URI, "rect");

        element.setAttribute("x", x.toString());
        element.setAttribute("y", y.toString());
        element.setAttribute("width", width.toString());
        element.setAttribute("height", height.toString());

        return element;
    }
};