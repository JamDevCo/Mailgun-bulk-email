$(document).ready(function () {
  var pretendFetchedData = [
    { title: "100x100", value: "http://via.placeholder.com/100x100" },
    { title: "120x120", value: "http://via.placeholder.com/120x120" },
    { title: "150x150", value: "http://via.placeholder.com/150x150" },
  ];

  tinymce.init({
    selector: "textarea#message",
    height: 300,
    menubar: false,
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "searchreplace visualblocks code fullscreen",
      "insertdatetime media table paste code help wordcount image",
    ],
    help_tabs: [
      "shortcuts", // the default shortcuts tab
      "keyboardnav", // the default keyboard navigation tab
      "plugins", // the default plugins tab
      {
        name: "versions",
        title: "Version",
        items: [
          {
            type: "htmlpanel",
            html: "<h1>Mailgun Send Version</h1><p>v2023-03-10</p>",
          },
        ],
      },
    ],

    a11y_advanced_options: true,
    toolbar:
      "undo redo | formatselect | " +
      "bold italic backcolor | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist outdent indent | " +
      "table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol" +
      "removeformat | image | help | code",
    table_toolbar:
      "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol",
    // image_prepend_url: "cid:",
    content_style:
      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",

    file_picker_types: "image",
    image_title: true,
    // image_list: pretendFetchedData,
    /* enable automatic uploads of images represented by blob or data URIs*/
    // automatic_uploads: true,

    // setup: function (editor) {
    //   editor.on("NodeChange", function (e) {
    //     if (e.element.tagName === "IMG") {
    //       e.element.setAttribute("data-original", e.element.currentSrc);
    //       e.element.setAttribute("src", `cid:${e.element.currentSrc}`);
    //     }
    //   });
    // },

    /* and here's our custom image picker*/
    // file_picker_callback: function (cb, value, meta) {
    //   var input = document.createElement("input");
    //   input.setAttribute("type", "file");
    //   input.setAttribute("accept", "image/*");

    //   /*
    //     Note: In modern browsers input[type="file"] is functional without
    //     even adding it to the DOM, but that might not be the case in some older
    //     or quirky browsers like IE, so you might want to add it to the DOM
    //     just in case, and visually hide it. And do not forget do remove it
    //     once you do not need it anymore.
    //   */

    //   input.onchange = function () {
    //     var file = this.files[0];

    //     var reader = new FileReader();
    //     reader.onload = function () {
    //       /*
    //         Note: Now we need to register the blob in TinyMCEs image blob
    //         registry. In the next release this part hopefully won't be
    //         necessary, as we are looking to handle it internally.
    //       */
    //       var id = "blobid" + new Date().getTime();
    //       var blobCache = tinymce.activeEditor.editorUpload.blobCache;
    //       var base64 = reader.result.split(",")[1];
    //       var blobInfo = blobCache.create(id, file, base64);
    //       blobCache.add(blobInfo);

    //       /* call the callback and populate the Title field with the file name */
    //       cb(blobInfo.blobUri(), { title: file.name });
    //     };
    //     reader.readAsDataURL(file);
    //   };

    //   input.click();
    // },

    // file_picker_types: 'image',
    /* and here's our custom image picker*/
    file_picker_callback: function (cb, value, meta) {
      var input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");

      /*
        Note: In modern browsers input[type="file"] is functional without
        even adding it to the DOM, but that might not be the case in some older
        or quirky browsers like IE, so you might want to add it to the DOM
        just in case, and visually hide it. And do not forget do remove it
        once you do not need it anymore.
      */

      input.onchange = function () {
        var file = this.files[0];

        var reader = new FileReader();
        reader.onload = function () {
          /*
            Note: Now we need to register the blob in TinyMCEs image blob
            registry. In the next release this part hopefully won't be
            necessary, as we are looking to handle it internally.
          */
          var id = "blobid" + new Date().getTime();
          var blobCache = tinymce.activeEditor.editorUpload.blobCache;
          var base64 = reader.result.split(",")[1];
          var blobInfo = blobCache.create(id, file, base64);
          blobCache.add(blobInfo);

          /* call the callback and populate the Title field with the file name */
          cb(blobInfo.blobUri(), { title: file.name });
        };
        reader.readAsDataURL(file);
      };

      input.click();
    },
  });
});
