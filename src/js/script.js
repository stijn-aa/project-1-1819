import {API} from "https://boekdeelfeature.netlify.com/node_modules/oba-wrapper/js/index.js"


( function () {

  const api = new API({
    key: '1e19898c87464e239192c8bfe422f280'
  });

  const application = {
    init: function() {

      router.init();
    },
    bookFind: function(book){

      return book.id === storage.bookId
    }
  }

  const storage = {
    bookId: undefined,
    addToCollect: function(book,id){
      console.log(id)
        let booksTemp = JSON.parse(localStorage.getItem('bookCollection'))

        if (booksTemp === null) {   
          booksTemp = []
        } 

        console.log(booksTemp);
        booksTemp.push(book);
        const uniques = [...new Set(booksTemp)]; //wouters code om book toe te voegen aan array als die er nog niet in zit #werkt niet

        localStorage.setItem('bookCollection',JSON.stringify(uniques)) // eigen localstorage ojbect maken met daarin de set item die het zet naar een eigen json file
    },
    currentId: undefined,
  }

  const utils = {
    clean: function(data){

      console.log(data)

      if (!Array.isArray(data)) {   
        data = [data]
      }

      const clean_data = data.map(function(book){

        return {
          titel : book.titles && book.titles.title && book.titles.title._text || undefined ,
          id : book.identifiers && book.identifiers["isbn-id"] && book.identifiers["isbn-id"]._text || storage.bookId,
          imgLink : book.coverimages && book.coverimages.coverimage[1] && book.coverimages.coverimage[1]._text || undefined,
          summery : book.summaries && book.summaries.summary && book.summaries.summary._text || undefined,
          author : book.authors && book.authors.author && book.authors.author._attributes && book.authors.author._attributes["search-term"] || "auteur onbekent"
        }

      })
      return clean_data;
    }
  }
 
  const render = {
    searchBar: function(){

      const searchButton = document.querySelector(".searchButton"); //als tekst sturen naar de browser
      searchButton.addEventListener("click", function() {
        routie("searchResults"); 
      })

      const collectionButton = document.querySelector(".collectionButton");
      collectionButton.addEventListener("click", function() {
        routie("collection");
      })

    },

    searchResults: function (items) {

      render.empty();
      console.log(items)
      localStorage.setItem('books',JSON.stringify(items))
      for (const book of items) {
        const titel = book.titel;
        const id = book.id;
        const imgLink = book.imgLink;
        const container = document.querySelector(".container");
        const article = document.createElement('article')
        let elementTempalte = // ejs laten renderen
        `
        <img src='${imgLink}'>
        <h1 class='bookTitel id${id}'>${titel}</h1>
        

        `
        article.innerHTML = elementTempalte
        container.appendChild(article);

        article.addEventListener("click", function(){
        storage.bookId = id;
        console.log(id);
        routie('detailPage');
        })
      }
      

    },

    detailPage: function(book){

      console.log(book);
      const titel = book.titel;
      const id = book.id;
      const imgLink = book.imgLink;
      const summery = book.summery;
      const author = book.author;
      console.log(titel);
      console.log(id);
      console.log(imgLink);
      console.log(summery);

      const container = document.querySelector(".container");
      const article = document.createElement('article')
      article.setAttribute("detail", "article")
      let bookArticle =
      `
      <h1 class='detailTitel ${id}'>${titel}</h1>
      <img class = "detailImg" src='${imgLink}'>
      <p class = "summery">${summery}</p>
      <p class = "auteur">${author}</p>
      
      <div class = "link">
      <a href='https://boekdeelfeature.netlify.com/#add/${id}'>https://boekdeelfeature.netlify.com/#add/${id}</a>
      <p>Deel dit boek</p>
      </div>
      `
      article.innerHTML = bookArticle
      container.appendChild(article);

      
    },

    empty: function() {

      const container = document.querySelector(".container");

      container.innerHTML = ""

    },

    loader: function(){

      const container = document.querySelector(".container");
      const article = document.createElement('article')
      let loader =
        `
        <div class='loader'>
        <img src='./src/img/loading.svg'>
        <h1>Loading</h1>
        </div>

        `
        article.innerHTML = loader
        container.appendChild(article);
    },
    smallLoader: function(){

      const container = document.querySelector(".container");
      const smallLoaderArticle = document.createElement('smallLoaderArticle')
      let smallLoader =
        `
        <div class='loader smallLoader'>
        <img src='./src/img/loading.svg'>
        <p>Boek toevoegen aan je lijst</p>
        </div>

        `
        smallLoaderArticle.innerHTML = smallLoader
        container.appendChild(smallLoaderArticle);
    },
    removeSmallLoader: function(){
      const smallLoaderArticle = document.querySelector('smallLoaderArticle')
      smallLoaderArticle.innerHTML = ""
      routie("collection");

    },
  
    collection: function(bookCollection){

      
      render.empty();
      console.log(bookCollection)
      for (const book of bookCollection) {
        const titel = book.titel;
        const id = book.id;
        const imgLink = book.imgLink;
        const container = document.querySelector(".container");
        const article = document.createElement('article')
        let elementTempalte =
        `
        
        <img src='${imgLink}'>
        <h1 class='bookTitel id${id}'>${titel}</h1>

        `
        article.innerHTML = elementTempalte
        container.appendChild(article);
        article.addEventListener("click", function(){
        storage.bookId = id;
        console.log(id);
        routie('detailPage');
        })
      }
      
    },
    sharedLink: function(books){
      render.removeSmallLoader();
      console.log(books)
      const book = books.find(application.bookFind);
      console.log(book)
      const id = book.id;
      storage.addToCollect(book,id)
    }

    



  }

  const router = {
    init: function() {
      routie({ //ejs
        '': function() {
          router.home();
        },
        'searchResults': function(){
          
          router.searchResults();
        },
        'collection': function(){
          router.collection()
        },
        'detailPage': function(){
         
          router.detail(storage.bookId);
        },
        'add/:id':function(){
          const id = document.URL.substring(document.URL.lastIndexOf('/') + 1)
          router.sharedLink(id);
          // router.collection();
           storage.currentId = id
        }

      })
    },
    home: function(){
      render.searchBar();
    },

    searchResults: async function(){

      render.empty();
      render.searchBar();
      render.loader();
      routie("");
      const search = document.querySelector(".searchTerm").value;
      const stream = await api.createStream("search/" + search + "&librarian=true&facet=type(book)"); //node fetch
      stream
      .pipe(utils.clean)
      .pipe(render.searchResults);
      
    },

    detail: function(id) {

      render.empty();
      render.searchBar();
      const books = JSON.parse(localStorage.getItem('books'))
      console.log(books)
      const book = books.find(application.bookFind);
      console.log(book);
      render.detailPage(book);

    },
    collection: function(){

      render.empty();
      render.searchBar();
      const bookCollection = JSON.parse(localStorage.getItem('bookCollection'))
      render.collection(bookCollection);
    },
    sharedLink: async function(id){
      render.searchBar();
      render.smallLoader();
      const stream = await api.createStream("search/" + id + "&librarian=true&facet=type(book)");
      stream
      .pipe(utils.clean)
      .pipe(render.sharedLink);
      
    }
  }
  
  



  application.init();

})();







