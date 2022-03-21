<script>
    let keys = {}

    function handleKeydown(event) {
        if (!event.repeat) {
            let key = event.key.toLowerCase()
            keys[key] = true
            // console.log(keys)

            if (keys['z']) key = 'z' + key
            else if (keys['.']) key = '.' + key
            console.log(key)

            const sample = document.querySelector(`[data-sample="${key}"]`)
            if (sample) {
                sample.currentTime = 0
                sample.play()
            }
        }
    }

    function handleKeyup(event) {
        keys[event.key.toLowerCase()] = false
        console.log(keys)
    }
</script>

<svelte:window on:keydown={handleKeydown} on:keyup={handleKeyup}/>

<div class="piano-container">
    <div class="piano">
        <div class="black-key" data-key="w" class:pressed={keys['w']}>W</div>
        <div class="black-key" data-key="e" class:pressed={keys['e']}>E</div>
        <div class="black-key" data-key="t" class:pressed={keys['t']}>T</div>
        <div class="black-key" data-key="y" class:pressed={keys['y']}>Y</div>
        <div class="black-key" data-key="u" class:pressed={keys['u']}>U</div>
        <div class="black-key" data-key="o" class:pressed={keys['o']}>O</div>
        <div class="black-key" data-key="p" class:pressed={keys['p']}>P</div>
        <!-- <div class="black-key" data-key="]" class:pressed={keys[']']}>]</div> -->
        <div class="white-key" data-key="a" class:pressed={keys['a']}>A</div>
        <div class="white-key" data-key="s" class:pressed={keys['s']}>S</div>
        <div class="white-key" data-key="d" class:pressed={keys['d']}>D</div>
        <div class="white-key" data-key="f" class:pressed={keys['f']}>F</div>
        <div class="white-key" data-key="g" class:pressed={keys['g']}>G</div>
        <div class="white-key" data-key="h" class:pressed={keys['h']}>H</div>
        <div class="white-key" data-key="j" class:pressed={keys['j']}>J</div>
        <div class="white-key" data-key="k" class:pressed={keys['k']}>K</div>
        <div class="white-key" data-key="l" class:pressed={keys['l']}>L</div>
        <div class="white-key" data-key=";" class:pressed={keys[';']}>;</div>
        <!-- <div class="white-key" data-key="'" class:pressed={keys['\'']}>'</div> -->
    </div>
</div>

<audio class="piano-sample" data-sample="w" src="./samples/Cs4.mp3"/>
<audio class="piano-sample" data-sample="e" src="./samples/Ds4.mp3"/>
<audio class="piano-sample" data-sample="t" src="./samples/Fs4.mp3"/>
<audio class="piano-sample" data-sample="y" src="./samples/Gs4.mp3"/>
<audio class="piano-sample" data-sample="u" src="./samples/As4.mp3"/>
<audio class="piano-sample" data-sample="o" src="./samples/Cs5.mp3"/>
<audio class="piano-sample" data-sample="p" src="./samples/Ds5.mp3"/>

<audio class="piano-sample" data-sample="zw" src="./samples/Cs3.mp3"/>
<audio class="piano-sample" data-sample="ze" src="./samples/Ds3.mp3"/>
<audio class="piano-sample" data-sample="zt" src="./samples/Fs3.mp3"/>
<audio class="piano-sample" data-sample="zy" src="./samples/Gs3.mp3"/>
<audio class="piano-sample" data-sample="zu" src="./samples/As3.mp3"/>
<audio class="piano-sample" data-sample="zo" src="./samples/Cs4.mp3"/>
<audio class="piano-sample" data-sample="zp" src="./samples/Ds4.mp3"/>

<audio class="piano-sample" data-sample=".w" src="./samples/Cs5.mp3"/>
<audio class="piano-sample" data-sample=".e" src="./samples/Ds5.mp3"/>
<audio class="piano-sample" data-sample=".t" src="./samples/Fs5.mp3"/>
<audio class="piano-sample" data-sample=".y" src="./samples/Gs5.mp3"/>
<audio class="piano-sample" data-sample=".u" src="./samples/As5.mp3"/>
<audio class="piano-sample" data-sample=".o" src="./samples/Cs6.mp3"/>
<audio class="piano-sample" data-sample=".p" src="./samples/Ds6.mp3"/>

<audio class="piano-sample" data-sample="a" src="./samples/C4.mp3"/>
<audio class="piano-sample" data-sample="s" src="./samples/D4.mp3"/>
<audio class="piano-sample" data-sample="d" src="./samples/E4.mp3"/>
<audio class="piano-sample" data-sample="f" src="./samples/F4.mp3"/>
<audio class="piano-sample" data-sample="g" src="./samples/G4.mp3"/>
<audio class="piano-sample" data-sample="h" src="./samples/A4.mp3"/>
<audio class="piano-sample" data-sample="j" src="./samples/B4.mp3"/>
<audio class="piano-sample" data-sample="k" src="./samples/C5.mp3"/>
<audio class="piano-sample" data-sample="l" src="./samples/D5.mp3"/>
<audio class="piano-sample" data-sample=";" src="./samples/E5.mp3"/>

<audio class="piano-sample" data-sample="za" src="./samples/C3.mp3"/>
<audio class="piano-sample" data-sample="zs" src="./samples/D3.mp3"/>
<audio class="piano-sample" data-sample="zd" src="./samples/E3.mp3"/>
<audio class="piano-sample" data-sample="zf" src="./samples/F3.mp3"/>
<audio class="piano-sample" data-sample="zg" src="./samples/G3.mp3"/>
<audio class="piano-sample" data-sample="zh" src="./samples/A3.mp3"/>
<audio class="piano-sample" data-sample="zj" src="./samples/B3.mp3"/>
<audio class="piano-sample" data-sample="zk" src="./samples/C4.mp3"/>
<audio class="piano-sample" data-sample="zl" src="./samples/D4.mp3"/>
<audio class="piano-sample" data-sample="z;" src="./samples/E4.mp3"/>

<audio class="piano-sample" data-sample=".a" src="./samples/C5.mp3"/>
<audio class="piano-sample" data-sample=".s" src="./samples/D5.mp3"/>
<audio class="piano-sample" data-sample=".d" src="./samples/E5.mp3"/>
<audio class="piano-sample" data-sample=".f" src="./samples/F5.mp3"/>
<audio class="piano-sample" data-sample=".g" src="./samples/G5.mp3"/>
<audio class="piano-sample" data-sample=".h" src="./samples/A5.mp3"/>
<audio class="piano-sample" data-sample=".j" src="./samples/B5.mp3"/>
<audio class="piano-sample" data-sample=".k" src="./samples/C6.mp3"/>
<audio class="piano-sample" data-sample=".l" src="./samples/D6.mp3"/>
<audio class="piano-sample" data-sample=".;" src="./samples/E6.mp3"/>

<style>
    .piano-container {
        display: flex;
        justify-content: center;
    }
    .piano {
        padding: 50px;
        border: 3px solid purple;
        border-radius: 10px; 
        display: grid;
        grid-template-columns: repeat(30, 1fr);
        grid-template-rows: repeat(8, 1fr);
        gap: 0;
        height: 328px;
        width: 704px;
    }
    .black-key, .white-key {
        display: flex;
        justify-content: center;
        border-radius: 7.5px;
        border: 1px solid black;
    }
    .black-key {
        background: black;
        color: white;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        z-index: 1;
        align-items: center;
        font-size: larger;
        font-weight: bold;
        border-width: 2px;
    }
    /* .black-key[data-key="]"] {
        border-bottom-right-radius: 0;
    } */
    .white-key {
        /* border: 1px solid black; */
        border-top-width: 2px;
        border-bottom-width: 2px;
        align-items: flex-end;
        padding-bottom: 50px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        font-size: x-large;
        font-weight: bolder;
    }
    .white-key[data-key="a"] {
        border-left-width: 2px;
    }
    .white-key[data-key=";"] {
        border-right-width: 2px;
    }
    .pressed {
        background: cadetblue;
    }

    /* Piano key positioning: */
    [data-key="w"] { grid-area: 1 / 3 / 6 / 5; }
    [data-key="e"] { grid-area: 1 / 6 / 6 / 8; }
    [data-key="t"] { grid-area: 1 / 12 / 6 / 14; }
    [data-key="y"] { grid-area: 1 / 15 / 6 / 17; }
    [data-key="u"] { grid-area: 1 / 18 / 6 / 20; }
    [data-key="o"] { grid-area: 1 / 24 / 6 / 26; }
    [data-key="p"] { grid-area: 1 / 27 / 6 / 29; }
    /* [data-key="]"] { grid-area: 1 / 33 / 6 / 34; } */
    [data-key="a"] { grid-area: 1 / 1 / 9 / 4; }
    [data-key="s"] { grid-area: 1 / 4 / 9 / 7; }
    [data-key="d"] { grid-area: 1 / 7 / 9 / 10; }
    [data-key="f"] { grid-area: 1 / 10 / 9 / 13; }
    [data-key="g"] { grid-area: 1 / 13 / 9 / 16; }
    [data-key="h"] { grid-area: 1 / 16 / 9 / 19; }
    [data-key="j"] { grid-area: 1 / 19 / 9 / 22; }
    [data-key="k"] { grid-area: 1 / 22 / 9 / 25; }
    [data-key="l"] { grid-area: 1 / 25 / 9 / 28; }
    [data-key=";"] { grid-area: 1 / 28 / 9 / 31; }
    /* [data-key="'"] { grid-area: 1 / 31 / 9 / 34; } */
    /* generated with the help of: https://cssgrid-generator.netlify.app/ */
</style>