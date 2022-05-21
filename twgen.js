//This is a generator of tailwind css classes
//It is used to generate the css classes for the tailwind css framework
// a better alternative to using @apply in tailwind css

//create object
let twgen = {
    //create an array of classes
    //eg: [{className: 'btn', value: 'rounded-md bg-grey-500 text-white p-2'}]
    classes: [],

    //create a function to add classes to the array
    //eg: addClass('btn', 'rounded-md bg-grey-500 text-white p-2')
    addClass: function (className, value) {
        this.classes.push({
            className: className,
            value: value
        });
    },

    //create a functin to add multiple classes to the array
    //eg: addClasses([{className: 'btn-1',value: 'rounded-md bg-grey-500 text-white p-2'},{className:'btn-2',value: 'rounded-md bg-grey-500 text-white p-2'}]);
    addClasses: function (classNames) {
        classNames.forEach(className => {
            this.addClass(className.className, className.value);
        });
    },

    //for browser usage
    //makes a backup of classes of every element being changed by twgen in the parameter data-twgen
    //eg: <div x-data-twgen="btn-1"></div>
    liveSetup: function () {
        this.classes.forEach(Class => {
            document.querySelectorAll(`[class]`).forEach(element => {
                if(element.getAttribute('class').includes(Class.className)){
                element.setAttribute('data-twgen', element.getAttribute('class'));
                element.setAttribute('class', element.getAttribute('class').replaceAll(Class.className, Class.value));
                }
            });
        });
        //remove the last style element from head
        document.head.removeChild(document.head.lastChild);
    },

    //for browser usage
    //restores the backup of classes of every element being changed by twgen in the parameter data-twgen
    //eg: <div class="rounded-md bg-grey-500 text-white p-2" x-data-twgen="btn-1"></div>
    liveTeardown: function () {
        this.classes.forEach(Class => {
            document.querySelectorAll(`[data-twgen]`).forEach(element => {
                element.setAttribute('class', element.getAttribute('data-twgen'));
                element.removeAttribute('data-twgen');
            });
        })
    },
    //create function to generate css classes
    tw: function (data) {
        //loop through the classes array
        for (let i = 0; i < this.classes.length; i++) {
            //if the className matches the data
            if (this.classes[i].className === data) {
                //return the value
                return this.classes[i].value;
            }
        }
    }
};

//export object
export default twgen;