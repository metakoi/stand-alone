/**
 * The menu
 * @param {HTMLElement} element The menu element
 * @param {LoaderFullscreen} fullscreen The fullscreen object
 * @param {String} locale The locale string
 * @param {AudioEngine} audioEngine The audio engine
 * @param {Object} externalSettings The external settings object
 * @param {AudioBank} audio Game audio
 * @constructor
 */
const Menu = function(
    element,
    fullscreen,
    locale,
    audioEngine,
    externalSettings,
    audio) {
    this.buttonBack = this.createButtonExit(audio);
    this.languageChooser = this.createLanguageChooser(locale);
    this.box = this.createBox(fullscreen, audioEngine, externalSettings, audio);
    this.element = element;
    this.element.onclick = this.hide.bind(this);
    this.element.appendChild(this.box);
};

Menu.prototype.ID_BOX = "menu-box";
Menu.prototype.CLASS_VISIBLE = "visible";
Menu.prototype.LANG_TITLE = "MENU";
Menu.prototype.LANG_VOLUME = "VOLUME";
Menu.prototype.LANG_GRASS_AUDIO = "TOGGLE_GRASS_AUDIO";
Menu.prototype.LANG_FLASHES = "TOGGLE_FLASHES";
Menu.prototype.LANG_FULLSCREEN = "TOGGLE_FULLSCREEN";
Menu.prototype.LANG_MENU = "MENU";
Menu.prototype.LANG_LANGUAGE = "LANGUAGE";
Menu.prototype.LANG_QUIT = "QUIT";
Menu.prototype.LANG_EXIT = "BACK";
Menu.prototype.KEY_VOLUME = "volume";
Menu.prototype.KEY_LANGUAGE = "language";
Menu.prototype.KEY_MSAA = "msaa";
Menu.prototype.KEY_GRASS_AUDIO = "grass-audio";
Menu.prototype.KEY_FLASHES = "flashes";
Menu.prototype.LANGUAGES = [
    ["en", "English"],
    ["de", "Deutsch (German)"],
    ["fr", "Français (French)"],
    ["ja", "日本語 (Japanese)"],
    ["zh", "简体中文 (Simplified Chinese)"],
    ["ko", "한국어 (Korean)"],
    ["nl", "Nederlands (Dutch)"],
    ["pl", "Polski (Polish)"],
    ["tr", "Türkçe (Turkish)"],
    ["pt", "Português (Portuguese)"],
    ["es", "Español (Spanish)"],
    ["ru", "Руccкий (Russian)"],
    ["fy", "Frysk (Frisian)"],
    ["uk", "Українська (Ukrainian)"],
    ["it", "Italiano (Italian)"],
    ["fil", "Filipino"],
    ["id", "Indonesian (Bahasa Indonesia)"]
];

/**
 * Create the menu box
 * @param {LoaderFullscreen} fullscreen The fullscreen object
 * @param {AudioEngine} audioEngine The audio engine
 * @param {Object} externalSettings The external settings object
 * @param {AudioBank} audio Game audio
 * @param {Boolean} createFullscreenButton If set to true, a fullscreen button will be created
 * @returns {HTMLDivElement} The menu box
 */
Menu.prototype.createBox = function(
    fullscreen,
    audioEngine,
    externalSettings,
    audio,
    createFullscreenButton) {
    const element = document.createElement("div");
    const table = document.createElement("table");

    element.id = this.ID_BOX;
    element.onclick = event => event.stopPropagation();

    element.appendChild(this.createTitle());

    table.appendChild(this.createVolumeSlider(audioEngine));
    table.appendChild(this.createGrassAudioToggle(audioEngine));
    table.appendChild(this.createFlashToggle(externalSettings));
    table.appendChild(this.createMSAAToggle());
    table.appendChild(this.languageChooser);

    element.appendChild(table);

    if(createFullscreenButton)
        element.appendChild(this.createButtonFullscreen(fullscreen, audio));

    element.appendChild(this.buttonBack);

    return element;
};

/**
 * Add the save & quit option
 * @param {AudioBank} audio Game audio
 */
Menu.prototype.addQuitOption = function(audio) {
    const quit = this.createButtonQuit();

    this.box.removeChild(this.buttonBack);
    this.box.appendChild(this.createButtonMenu());

    if (quit)
        this.box.appendChild(quit);

    this.box.appendChild(this.buttonBack);
};

/**
 * Create the title element
 * @returns {HTMLHeadingElement} The title element
 */
Menu.prototype.createTitle = function() {
    const element = document.createElement("h1");

    element.appendChild(document.createTextNode(language.get(this.LANG_TITLE)));

    return element;
};

/**
 * Create a data cell element
 * @param {HTMLElement} element The element to wrap
 * @returns {HTMLTableDataCellElement}
 */
Menu.prototype.createTD = function(element) {
    const td = document.createElement("td");

    td.appendChild(element);

    return td;
};

/**
 * Create the volume slider
 * @param {AudioEngine} audioEngine The audio engine
 * @returns {HTMLTableRowElement} The table row
 */
Menu.prototype.createVolumeSlider = function(audioEngine) {
    const row = document.createElement("tr");
    const label = document.createElement("label");
    const element = document.createElement("input");

    element.type = "range";
    element.min = "0";
    element.max = "1";
    element.step = ".01";

    if (window["localStorage"].getItem(this.KEY_VOLUME)) {
        element.value = window["localStorage"].getItem(this.KEY_VOLUME);

        audioEngine.setMasterVolume(element.valueAsNumber);
    }
    else
        element.value = "1";

    element.oninput = () => {
        window["localStorage"].setItem(this.KEY_VOLUME, element.value);

        audioEngine.setMasterVolume(element.valueAsNumber);
    };

    label.appendChild(document.createTextNode(language.get(this.LANG_VOLUME)));

    row.appendChild(this.createTD(label));
    row.appendChild(this.createTD(element));

    return row;
};

/**
 * Create a grass audio toggle
 * @param {AudioEngine} audioEngine The audio engine
 * @returns {HTMLTableRowElement} The audio toggle
 */
Menu.prototype.createGrassAudioToggle = function(audioEngine) {
    const row = document.createElement("tr");
    const label = document.createElement("label");
    const element = document.createElement("input");

    element.type = "checkbox";
    element.checked = true;

    if (window["localStorage"].getItem(this.KEY_GRASS_AUDIO)) {
        element.checked = window["localStorage"].getItem(this.KEY_GRASS_AUDIO) === "true";
        audioEngine.granular = element.checked;
    }
    else
        element.checked = true;

    element.onchange = () => {
        window["localStorage"].setItem(this.KEY_GRASS_AUDIO, element.checked.toString());

        audioEngine.granular = element.checked;
    };

    label.appendChild(document.createTextNode(language.get(this.LANG_GRASS_AUDIO)));
    label.appendChild(element);

    row.appendChild(this.createTD(label));
    row.appendChild(this.createTD(element));

    return row;
};

/**
 * Create the thunderstorm flash toggle
 * @param {Object} externalSettings The external settings object
 * @returns {HTMLTableRowElement} The effect toggle
 */
Menu.prototype.createFlashToggle = function(externalSettings) {
    const row = document.createElement("tr");
    const label = document.createElement("label");
    const element = document.createElement("input");

    element.type = "checkbox";
    element.checked = true;

    if (window["localStorage"].getItem(this.KEY_FLASHES)) {
        element.checked = window["localStorage"].getItem(this.KEY_FLASHES) === "true";

        externalSettings.flash = element.checked;
    }
    else
        element.checked = true;

    element.onchange = () => {
        window["localStorage"].setItem(this.KEY_FLASHES, element.checked.toString());

        externalSettings.flash = element.checked;
    };

    label.appendChild(document.createTextNode(language.get(this.LANG_FLASHES)));
    label.appendChild(element);

    row.appendChild(this.createTD(label));
    row.appendChild(this.createTD(element));

    return row;
};

/**
 * Create the MSAA toggle
 * @returns {HTMLTableRowElement} The MSAA Toggle
 */
Menu.prototype.createMSAAToggle = function() {
    const row = document.createElement("tr");
    const label = document.createElement("label");
    const element = document.createElement("input");

    element.type = "checkbox";
    element.checked = true;

    if (window["localStorage"].getItem(this.KEY_MSAA))
        element.checked = window["localStorage"].getItem(this.KEY_MSAA) === "true";
    else
        element.checked = true;

    element.onchange = () => {
        window["localStorage"].setItem(this.KEY_MSAA, element.checked.toString());

        setTimeout(() => {
            reloadGame();
        }, 100);
    };

    label.appendChild(document.createTextNode("MSAA"));
    label.appendChild(element);

    row.appendChild(this.createTD(label));
    row.appendChild(this.createTD(element));

    return row;
};

/**
 * Create a language chooser
 * @param {String} locale The locale string
 * @returns {HTMLTableRowElement} The table row
 */
Menu.prototype.createLanguageChooser = function(locale) {
    const row = document.createElement("tr");
    const label = document.createElement("label");
    const select = document.createElement("select");

    for (const language of this.LANGUAGES) {
        const option = document.createElement("option");

        option.value = language[0];
        option.appendChild(document.createTextNode(language[1]));

        if (option.value === locale)
            option.selected = true;

        select.appendChild(option);
    }

    select.onchange = () => {
        window["localStorage"].setItem(this.KEY_LANGUAGE, select.value);

        reloadGame();
    };

    label.appendChild(document.createTextNode(language.get(this.LANG_LANGUAGE)));

    row.appendChild(this.createTD(label));
    row.appendChild(this.createTD(select));

    return row;
};

/**
 * Create the fullscreen toggle button
 * @param {LoaderFullscreen} fullscreen The fullscreen object
 * @param {AudioBank} audio Game audio
 * @returns {HTMLButtonElement} The fullscreen toggle button
 */
Menu.prototype.createButtonFullscreen = function(fullscreen, audio) {
    const element = document.createElement("button");

    element.appendChild(document.createTextNode(language.get(this.LANG_FULLSCREEN)));
    element.onclick = () => {
        fullscreen.toggle();

        audio.effectClick.play();
    };

    return element;
};

/**
 * Create the back to menu button
 */
Menu.prototype.createButtonMenu = function() {
    const element = document.createElement("button");

    element.appendChild(document.createTextNode(language.get(this.LANG_MENU)));
    element.onclick = () => {
        reloadMenu();
    };

    return element;
};

/**
 * Create the quit button
 * @returns {HTMLButtonElement|null} The quit button, or null if this is not possible
 */
Menu.prototype.createButtonQuit = function() {
    if (window["require"]) {
        const remote = window["require"]("electron")["remote"];
        const w = remote["getCurrentWindow"]();
        const element = document.createElement("button");

        element.appendChild(document.createTextNode(language.get(this.LANG_QUIT)));
        element.onclick = () => {
            w["close"]();
        };

        return element;
    }

    return null;
};

/**
 * Create the exit button
 * @param {AudioBank} audio Game audio
 * @returns {HTMLButtonElement} The button element
 */
Menu.prototype.createButtonExit = function(audio) {
    const element = document.createElement("button");

    element.appendChild(document.createTextNode(language.get(this.LANG_EXIT)));
    element.onclick = () => {
        this.hide();

        audio.effectClick.play();
    };

    return element;
};

/**
 * Show the menu
 */
Menu.prototype.show = function() {
    this.element.classList.add(this.CLASS_VISIBLE);
};

/**
 * Hide the menu
 */
Menu.prototype.hide = function() {
    this.element.classList.remove(this.CLASS_VISIBLE);
};

/**
 * Toggle the menu
 */
Menu.prototype.toggle = function() {
    if (this.element.classList.contains(this.CLASS_VISIBLE))
        this.hide();
    else
        this.show();
};
