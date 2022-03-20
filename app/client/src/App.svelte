<script>
    import Piano from './Piano.svelte'

    let rand = '...';
    let previous;
    async function getRand() {
    //   fetch("./rand")
      let result = await fetch("./predict")
      let resultText = await result.text()
      handle(resultText)
    }

    function setPromise() {
        rand = '...'
        promise = getRand()
    }

    function handle(result) {
        rand = result
        // if (previous === '[0]') rand = '[1]'
        // else if (previous === '[1]') rand = '[2]'
        // else rand = '[0]'
        // previous = rand
    }

    let promise

    function reveal(node) {
        return {
            css: t => {
                return `
                    filter: blur(${t}px) grayscale(${t * 80}%) opacity(${t * 0.4});
                `
            }
        }
    }

    function handleSubmit(event) {
        rand = '...'
        promise = uploadFileFrom(event)
    }

    async function uploadFileFrom(event) {
        const formData = new FormData(event.target)
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        })
        let responseText = await response.text()
        handle(responseText)
    }
</script>

{#if promise}
    {#await promise}
        <div class="loading">Loading... Please wait...</div>
    {/await}
{/if}

<!-- on:submit|preventDefault={handleSubmit} -->
<!-- method="POST" action="/upload" enctype="multipart/form-data" -->

<div class="container">
    <form on:submit|preventDefault={handleSubmit}>
        <input type="file" name="file" accept=".mid"/>
        <input type="submit" value="submit"/>
    </form>
</div>
  
<h1>{rand}</h1>
<button on:click={setPromise}>Get a random number</button>

<!-- https://www.wpclipart.com/famous/composers/ -->
<div class="composers">
    <div class="bach" class:revealed={rand === '[0]'}>
        <h2>BACH</h2>
            <img class:mystery={rand !== '[0]'} src="./Johann_Sebastian_Bach.png" alt="Bach"/> <!-- https://www.wpclipart.com/famous/composers/Bach/Johann_Sebastian_Bach.png.html -->
        <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur, voluptates. Fugiat sapiente vero, vel aut nisi eum maxime? Corrupti totam fugit sint quisquam dolorum harum. Illo, impedit sit. Maiores amet rem quam ea ut libero delectus atque sapiente nemo, ducimus quod ipsum magni, facilis unde? In delectus quisquam ad iure.
        </p>
    </div>
    <div class="beethoven" class:revealed={rand === '[1]'}>
        <h2>BEETHOVEN</h2>
        <img class:mystery={rand !== '[1]'} src="./Beethoven_by_Stieler_2.jpg" alt="Beethoven"/> <!-- https://www.wpclipart.com/famous/composers/Beethoven/Beethoven_by_Stieler_2.jpg.html -->
        <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur, voluptates. Fugiat sapiente vero, vel aut nisi eum maxime? Corrupti totam fugit sint quisquam dolorum harum. Illo, impedit sit. Maiores amet rem quam ea ut libero delectus atque sapiente nemo, ducimus quod ipsum magni, facilis unde? In delectus quisquam ad iure.
        </p>
    </div>
    <div class="schubert" class:revealed={rand === '[2]'}>
        <h2>SCHUBERT</h2>
        <img class:mystery={rand !== '[2]'} src="./Franz_Schubert_2.jpg" alt="Schubert"/> <!-- https://www.wpclipart.com/famous/composers/Schubert/Franz_Schubert_2.jpg.html -->
        <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Pariatur, voluptates. Fugiat sapiente vero, vel aut nisi eum maxime? Corrupti totam fugit sint quisquam dolorum harum. Illo, impedit sit. Maiores amet rem quam ea ut libero delectus atque sapiente nemo, ducimus quod ipsum magni, facilis unde? In delectus quisquam ad iure.
        </p>
    </div>
</div>

<Piano />

<style>
    .composers {
        display: flex;
        gap: 10px;
    }
    .composers > div {
        flex: 1;
        display: flex;
        flex-direction: column;
        /* justify-content: center; */
        align-items: center;
        border-radius: 10px;
        padding: 20px;
    }
    img {
        height: 270px;
        width: 186px;
        transition: filter 1s;
    }
    img.mystery {
        /* opacity: 0.4; */
        filter: blur(1px) grayscale(80%) opacity(0.4);
        transition: none;
    }
    .loading {
        position: absolute;
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