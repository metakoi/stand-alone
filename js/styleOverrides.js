let renderSnow = false;

{
    const date = new Date();
    const day = date.getUTCDate();
    const month = date.getUTCMonth();
    const head = document.getElementsByTagName("head")[0];

    /**
     * Override existing CSS
     * @param {HTMLHeadElement} head The document head
     * @param {string} file A path to a CSS file
     */
    const overrideCSS = (head, file) => {
        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = file;
        link.media = "all";

        head.appendChild(link);

        if (file === "winter.css")
            renderSnow = true;
    };

    /**
     * A date based override
     * @param {number} day The day
     * @param {number} month The month
     * @param {string} css The CSS file to apply on this date
     * @constructor
     */
    const Override = function(day, month, css) {
        this.day = day;
        this.month = month - 1;
        this.css = css;
    };

    const autumn = "autumn.css";
    const winter = "winter.css";
    const overrides = [
        // Halloween
        new Override(28, 10, autumn),
        new Override(29, 10, autumn),
        new Override(30, 10, autumn),
        new Override(31, 10, autumn),
        new Override(1, 11, autumn),

        // Winter
        new Override(22, 12, winter),
        new Override(23, 12, winter),
        new Override(24, 12, winter),
        new Override(25, 12, winter),
        new Override(26, 12, winter),
        new Override(27, 12, winter),
        new Override(28, 12, winter),
        new Override(29, 12, winter),
        new Override(30, 12, winter),
        new Override(31, 12, winter),
        new Override(1, 1, winter),
        new Override(2, 1, winter),
        new Override(3, 1, winter),
        new Override(4, 1, winter),
        new Override(5, 1, winter),
        new Override(6, 1, winter)
    ];

    for (let override = 0, overrideCount = overrides.length; override < overrideCount; ++override)
        if (overrides[override].day === day && overrides[override].month === month)
            overrideCSS(head, overrides[override].css);
}