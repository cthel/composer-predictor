<script>
    import { fly } from 'svelte/transition'
    // import Piano from './Piano.svelte'

    let result

    function handle(res) {
        result = res
        document.body.style.position = 'relative'
    }

    let promise
    $: document.body.style.position = promise ? 'fixed' : 'relative'

    function handleSubmit() {
        result = null
        promise = uploadFile()
    }

    async function uploadFile() {
        const formData = new FormData(document.querySelector('#file-upload'))
        const response = await fetch('/upload', { method: 'POST', body: formData })
        const responseText = await response.text()
        if (response.ok)
            handle(responseText)
        else if (response.status === 413)
            alert('Your MIDI file is too large. Please try again with a smaller file.')
        else
            alert('Sorry, something went wrong. Please try again with a different file.')
    }
</script>

{#await promise}
    <div class="loading">Loading... Please wait...</div>
{/await}

<div class="container">
    <form id="file-upload">
        <label>
            <strong>Upload a MIDI (.mid) file:</strong>
            <input type="file" name="file" accept=".mid" on:input={handleSubmit}/>
            (25KB limit)
        </label>
    </form>
</div>

<div class="downloads">
    <form method="GET" action="bach_847_format0.mid">
        <input type="submit" value="Download Bach MIDI"/>
        <a href="http://www.piano-midi.de/bach.htm">More...</a>
    </form>
    <form method="GET" action="elise_format0.mid">
        <input type="submit" value="Download Beethoven MIDI"/>
        <a href="http://www.piano-midi.de/beeth.htm">More...</a>
    </form>
    <form method="GET" action="schu_143_2_format0.mid">
        <input type="submit" value="Download Schubert MIDI"/>
        <a href="http://www.piano-midi.de/schub.htm">More...</a>
    </form>
</div>

<!-- https://www.wpclipart.com/famous/composers/ -->
<div class="composers">
    <div class="bach" class:revealed={result === '[0]'}>
        <h2 class:mystery={result !== '[0]'}>BACH</h2>
        <!-- https://www.wpclipart.com/famous/composers/Bach/Johann_Sebastian_Bach.png.html -->
        <img class:mystery={result !== '[0]'} src="./Johann_Sebastian_Bach.png" alt="Bach"/>
        {#if result === '[0]'}
        <p in:fly={{ y: -10, duration: 1000 }}>
            That sounds like <strong>Bach</strong>.
            <br/><br/>
            Bach lived from 1685 to 1750 and composed during the <strong>Baroque</strong> period.
            <br/><br/>
            Contemporaries include: Handel, Scarlatti, Vivaldi
        </p>
        {/if}
    </div>
    <div class="beethoven" class:revealed={result === '[1]'}>
        <h2 class:mystery={result !== '[1]'}>BEETHOVEN</h2>
        <!-- https://www.wpclipart.com/famous/composers/Beethoven/Beethoven_by_Stieler_2.jpg.html -->
        <img class:mystery={result !== '[1]'} src="./Beethoven_by_Stieler_2.jpg" alt="Beethoven"/>
        {#if result === '[1]'}
        <p in:fly={{ y: -10, duration: 1000 }}>
            That sounds like <strong>Beethoven</strong>.
            <br/><br/>
            Beethoven lived from 1770 to 1827 and composed during the <strong>Classical</strong> period.
            <br/><br/>
            Contemporaries include: Boccherini, Haydn, Mozart
        </p>
        {/if}
    </div>
    <div class="schubert" class:revealed={result === '[2]'}>
        <h2 class:mystery={result !== '[2]'}>SCHUBERT</h2>
        <!-- https://www.wpclipart.com/famous/composers/Schubert/Franz_Schubert_2.jpg.html -->
        <img class:mystery={result !== '[2]'} src="./Franz_Schubert_2.jpg" alt="Schubert"/>
        {#if result === '[2]'}
        <p in:fly={{ y: -10, duration: 1000 }}>
            That sounds like <strong>Schubert</strong>.
            <br/><br/>
            Schubert lived from 1797 to 1828 and composed during the <strong>Romantic</strong> period.
            <br/><br/>
            Contemporaries include: Chopin, Mendelssohn, Schumann
        </p>
        {/if}
    </div>
</div>

<!-- <Piano />   -->

<style>
    .container {
        display: flex;
        justify-content: center;
    }
    .container > form {
        border: 3px solid black;
        border-radius: 10px;
        padding: 20px;
        padding-top: 5px;
        padding-bottom: 5px;
        margin-bottom: 30px;
    }
    .downloads {
        display: flex;
        justify-content: space-around;
    }
    .downloads > form {
        display: flex;
        gap: 20px;
        align-items: center;
    }
    .composers {
        display: flex;
        gap: 10px;
    }
    .composers > div {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-radius: 10px;
        padding: 20px;
        height: 555px;
    }
    h2.mystery {
        filter: blur(5px);
    }
    img {
        height: 270px;
        width: 186px;
        transition: filter 1s;
    }
    img.mystery {
        filter: blur(1px) grayscale(80%) opacity(0.4);
        transition: none;
    }
    p {
        margin-top: 30px;
        text-align: left;
    }
    .loading {
        position: fixed;
        top: 50%;
        left: 50%;
        z-index: 10;
        height: 100%;
        width: 100%;
        background: rgb(0, 0, 0, 0.2);
        transform: translate(-50%, -50%);
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: large;
    }
    .bach {
        border: 3px solid rgba(53, 62, 75, 0.5);
        transition: border 0s;
    }
    .bach.revealed {
        border: 3px solid rgba(53, 62, 75);
        transition: border 1s;
    }
    .beethoven {
        border: 3px solid rgba(174, 61, 59, 0.5);
        transition: border 0s;
    }
    .beethoven.revealed {
        border: 3px solid rgba(174, 61, 59);
        transition: border 1s;
    }
    .schubert {
        border: 3px solid rgba(130, 139, 112, 0.5);
        transition: border 0s;
    }
    .schubert.revealed {
        border: 3px solid rgba(130, 139, 112);
        transition: border 1s;
    }
</style>