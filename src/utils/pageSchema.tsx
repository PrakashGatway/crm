// src/utils/pageTypeSchema.js

export const PAGE_TYPES_SCHEMA = {
  "city_page": {
    label: "city_page",
    fields: [
      { name: "heroImage", type: "file", label: "Hero Image", required: false },
    ],
    sections: [
      {
        type: "StudyDestinations",
        label: "Study Destinations",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" }
        ],
      },
      {
        type: "AcademicPrograms",
        label: "Academic Programs",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          // {
          //   name: "testimonials",
          //   type: "array",
          //   label: "Testimonials",
          //   itemFields: [
          //     { name: "name", type: "text", label: "Customer Name" },
          //     { name: "role", type: "text", label: "Role" },
          //     { name: "content", type: "textarea", label: "Quote" },
          //     { name: "avatar", type: "text", label: "Avatar URL" },
          //   ],
          // },
        ],
      },
      {
        type: "WhyChooseUs",
        label: "Why Choose Us",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "Cards",
            type: "array",
            label: "Cards",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "icon", type: "text", label: "Icon" },
              { name: "content", type: "textarea", label: "Quote" },
            ],
          },
        ],
      },
      {
        type: "content",
        label: "Content",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "content", type: "editor", label: "Section content" },
        ],
      },
    ],
  },

  country_page: {
    label: "country_page",
    fields: [
      { name: "heroImage", type: "file", label: "Hero Image", required: false },
      { name: "roadmapImage", type: "file", label: "Roadmap Image", required: false },
      { name: "mobileRoadMap", type: "file", label: "Mobile Roadmap Image", required: false },
      { name: "sliderImage", type: "file", label: "Slider Image", required: false },
    ],
    sections: [
      {
        type: "hero",
        label: "Hero Section",
        fields: [
          {
            name: "points",
            type: "array",
            label: "Points",
            itemFields: [
              { name: "content", type: "text", label: "Quote" },
            ],
          },
          {
            name: "stats",
            type: "array",
            label: "Stats",
            itemFields: [
              { name: "value", type: "text", label: "Value" },
              { name: "content", type: "text", label: "Quote" },
            ],
          },
          { name: "title", type: "text", label: "form Title" },
          { name: "subtitle", type: "text", label: "form Sub Title", required: false }
        ],
      },
      {
        type: "form-section",
        label: "Form Section",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "roadmapTitle", type: "text", label: "Roadmap Title", required: false }
        ],
      },
      {
        type: "WhyChooseUs",
        label: "Why Choose Us",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "Cards",
            type: "array",
            label: "Cards",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "icon", type: "text", label: "Icon" },
              { name: "content", type: "textarea", label: "Quote" },
            ],
          },
        ],
      },
      {
        type: "BestUniversities",
        label: "Best Universities",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "Cards",
            type: "array",
            label: "Cards",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "qsRank", type: "text", label: "Qsrank" },
              { name: "description", type: "text", label: "Description" },
              { name: "location", type: "text", label: "Location" },
              { name: "Courses", type: "array", label: "Courses", itemType: "text" },
              { name: "year", type: "text", label: "Year" },
              { name: "icon", type: "text", label: "Icon" },
              {name : "slug",type: "text", label : "Slug"}
            
            ],
          },
        ],
      },
      {
        type: "CostofStudying",
        label: "Cost of Studying",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTitle", type: "text", label: "Section subTitle" },
          {
            name: "Table",
            type: "array",
            label: "Table",
            itemFields: [
              {
                name: "iconitem",
                label: "Icon Item"
              },
              {
                name: "tableTitle",
                type: "array",
                label: "Table Title",
                itemFields: [
                  { name: "tabletitle", type: "text", label: "Table Title" }
                ]
              },

              { name: "tablerow", type: "text", label: "Table Row" },

              {
                name: "tablecolumn1",
                type: "array",
                label: "Table Column 1",
                itemFields: [
                  {
                    name: "columnvalue",
                    type: "text",
                    label: "Column Value"
                  }
                ]
              },

              {
                name: "tablecolumn2",
                type: "array",
                label: "Table Column 2",
                itemFields: [
                  {
                    name: "columnvalue",
                    type: "text",
                    label: "Column Value"
                  }
                ]
              },

              {
                name: "tablecolumn3",
                type: "array",
                label: "Table Column 3",
                itemFields: [
                  {
                    name: "columnvalue",
                    type: "text",
                    label: "Column Value"
                  }
                ]
              }
            ]
          },
          {
            name: "educationloan",
            label: "Education Loan",
            type: "array",
            itemFields: [
              { name: "icon", label: "Icon", type: "text" },
              { name: "title", label: "Title", type: "text" },
              { name: "educationlist", label: "Education List", type: "text" }
            ]
          },
          {
            name: "scholarship",
            label: "Scholarships",
            type: "array",
            itemFields: [
              { name: "icon", label: "Icon", type: "text" },
              { name: "title", label: "Title", type: "text" },
              { name: "scholarshiplist", label: "Scholarship List", type: "text" },
              { name: "scholarshipsublist", label: "Scholarship Sub List", type: "text" },
              { name: "scholarshiptag", label: "Scholarship List Tag", type: "text" }


            ]
          }
        ]


      },
      {
        type: "UniversityIntakes",
        label: "University Intakes",
        fields: [
          { name: "sectiontitle", label: "Section Title", type: "text" },
          { name: "sectionsubtitle", label: "Section Sub Title", type: "text" },
          {
            name: "intakecards", label: "Intake Cards", type: "array",
            itemFields: [
              { name: "cardtitle", label: "Card Title", type: "text" },
              { name: "cardtag", label: "Card Tag", type: "text" },
              { name: "cardlist", label: "Card List", type: "text" },
              { name: "cardfeature", label: "Card Feature University", type: "text" },
            ]
          }

        ]

      },
      {
        type: "gatewayhelps",
        label: "Gateway Helps",
        fields: [
          { name: "sectiontitle", label: "Section Title", type: "text" },
          { name: "sectionsubtitle", label: "Section Sub Title", type: "text" },
          { name: "sectioncontent", label: "Section Content", type: "editor" },
          {
            name: "sectioncard", label: "Section Card", type: "array",
            itemFields: [
              { name: "cardicon", label: "Card Icon", type: "text" },
              { name: "cardbadge", label: "Card Badge", type: "text" },
              { name: "cardtitle", label: "Card Title", type: "text" },
              { name: "cardsubtitle", label: "Card Sub Title", type: "text" },
            ]
          }

        ]
      },
      {
        type : "scholarships",
        label  :"Scholarships",
        fields : [
          {name : "sectiontitle",label : "Section Title",type : "text"},
          {name : "sectionsubtitle",label : "Section Sub Title",type : "text"},
          {name : "scholarshipcards",label : "Scholarship Cards",type : "array",
            itemFields : [
              {name : "cardbadge" , label : "Card Badge" , type : "text"},
              {name : "cardtitle" , label : "Card Title" , type : "text"},
              {name : "cardsubtitle" , label : "Card Sub Title" , type : "text"},
              {name : "cardtags" , label : "Card Tags" , type : "text"},
              {name : "slug" , label : "Slug" , type : "text"},
            ]
          },
        ]
      },
      {
        type: "slider",
        label: "Slider Card",
        fields: [
          { name: "label", type: "text", label: "Label", required: false },
          { name: "title", type: "text", label: "Title", required: false },
        ],
      },
    ],
  },
  home_page: {
    label: "home_page",
    fields: [
      { name: "heroImage", type: "file", label: "Hero Image", required: false },
      { name: "roadmapImage", type: "file", label: "Roadmap Image", required: false },
      { name: "mobileRoadMap", type: "file", label: "Mobile Roadmap Image", required: false }
    ],
    sections: [
      {
        type: "hero",
        label: "Hero Section",
        fields: [
          { name: "university", type: "text", label: "University", required: false },
          { name: "students", type: "text", label: "Students", required: false },
          { name: "cities", type: "text", label: "Cities", required: false }
        ],
      },
      {
        type: "form-section",
        label: "Form Section",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "roadmapTitle", type: "text", label: "Roadmap Title", required: false }
        ],
      },
      {
        type: "WhyChooseUs",
        label: "Why Choose Us",
        fields: [
          { name: "title", type: "text", label: "Section Title" },
          { name: "subTittle", type: "text", label: "Section Sub Title" },
          {
            name: "Cards",
            type: "array",
            label: "Cards",
            itemFields: [
              { name: "name", type: "text", label: "Label" },
              { name: "icon", type: "text", label: "Icon" },
              { name: "content", type: "textarea", label: "Quote" },
            ],
          },
        ],
      },
      {
        type: "slider",
        label: "Slider Card",
        fields: [
          { name: "label", type: "text", label: "Label", required: false },
          { name: "title", type: "text", label: "Title", required: false },
        ],
      },
    ],
  },
};