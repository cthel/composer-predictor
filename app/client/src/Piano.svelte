<div class="container">
    <div class="piano">
        <div class="black-key" data-key="87">W</div>
        <div class="black-key" data-key="69">E</div>
        <div class="black-key" data-key="84">T</div>
        <div class="black-key" data-key="89">Y</div>
        <div class="black-key" data-key="85">U</div>
        <div class="black-key" data-key="79">O</div>
        <div class="black-key" data-key="80">P</div>
        <div class="black-key" data-key="221">]</div>
        <div class="white-key" data-key="65">A</div>
        <div class="white-key" data-key="83">S</div>
        <div class="white-key" data-key="68">D</div>
        <div class="white-key" data-key="70">F</div>
        <div class="white-key" data-key="71">G</div>
        <div class="white-key" data-key="72">H</div>
        <div class="white-key" data-key="74">J</div>
        <div class="white-key" data-key="75">K</div>
        <div class="white-key" data-key="76">L</div>
        <div class="white-key" data-key="186">;</div>
        <div class="white-key" data-key="222">'</div>
    </div>
</div>

<style>
    .container {
        display: flex;
        justify-content: center;
    }
    .piano {
        padding: 50px;
        border: 2px solid purple;
        border-radius: 5px; 
        display: grid;
        grid-template-columns: repeat(33, 1fr);
        grid-template-rows: repeat(8, 1fr);
        gap: 0;
        height: 328px;
        width: 704px;
    }
    .black-key, .white-key {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .black-key {
        background: black;
        color: white;
        border-radius: 10%;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        z-index: 1;
    }
    .white-key {
        border: 1px solid black;
    }

    /* Key positioning: */
    [data-key="87"] { grid-area: 1 / 3 / 6 / 5; }
    [data-key="69"] { grid-area: 1 / 6 / 6 / 8; }
    [data-key="84"] { grid-area: 1 / 12 / 6 / 14; }
    [data-key="89"] { grid-area: 1 / 15 / 6 / 17; }
    [data-key="85"] { grid-area: 1 / 18 / 6 / 20; }
    [data-key="79"] { grid-area: 1 / 24 / 6 / 26; }
    [data-key="80"] { grid-area: 1 / 27 / 6 / 29; }
    [data-key="221"] { grid-area: 1 / 33 / 6 / 34; }
    [data-key="65"] { grid-area: 1 / 1 / 9 / 4; }
    [data-key="83"] { grid-area: 1 / 4 / 9 / 7; }
    [data-key="68"] { grid-area: 1 / 7 / 9 / 10; }
    [data-key="70"] { grid-area: 1 / 10 / 9 / 13; }
    [data-key="71"] { grid-area: 1 / 13 / 9 / 16; }
    [data-key="72"] { grid-area: 1 / 16 / 9 / 19; }
    [data-key="74"] { grid-area: 1 / 19 / 9 / 22; }
    [data-key="75"] { grid-area: 1 / 22 / 9 / 25; }
    [data-key="76"] { grid-area: 1 / 25 / 9 / 28; }
    [data-key="186"] { grid-area: 1 / 28 / 9 / 31; }
    [data-key="222"] { grid-area: 1 / 31 / 9 / 34; }
</style>