const inputs = document.querySelectorAll('input.block-content');
const blocks = document.getElementById('blocks');

function resizeInput(input) {
    input.style.width = (input.value.length || 1) + 'ch';
}

function adjustScrollbar() {
    if (blocks.scrollWidth > blocks.clientWidth) {
        blocks.className = 'scrollbar';
    } else {
        blocks.className = 'no-scrollbar';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    resizeInputs();
    adjustScrollbar();
    generateRegex();
});

window.addEventListener('resize', adjustScrollbar);
blocks.addEventListener('input', generateRegex);

function groupString(string) {
    if (string.length > 1) {
        return `(${escapeString(string)})`;
    }
    return escapeString(string);
}

function generateRegex() {
    let regex = '';

    const blockElements = blocks.children;
    for (let block of blockElements) {
        const contentElement = block.getElementsByClassName('block-content')[0];
        if (contentElement.tagName === 'INPUT') {
            let value = contentElement.value;
            switch (block.className) {
                case 'block literal string':
                    regex += groupString(value);
                    break;

                case 'block repeat zero-plus':
                    regex += `${groupString(value)}*`;
                    break;

                case 'block repeat one-plus':
                    regex += `${groupString(value)}+`;
                    break;

                case 'block repeat zero-or-one':
                    regex += `${groupString(value)}?`;
                    break;
            }
        } else if (contentElement.tagName === 'SPAN') {
            switch (block.className) {
                case 'block anchor str-start':
                    regex += '^';
                    break;
                case 'block anchor str-end':
                    regex += '$';
                    break;

                case 'block boundary word':
                    regex += '\\b';
                    break;

                case 'block chars any':
                    regex += '.';
                    break;

                case 'block chars digit':
                    regex += '\\d';
                    break;

                case 'block chars non-digit':
                    regex += '\\D';
                    break;
    
                case 'block chars whitespace':
                    regex += '\\s';
                    break;

                case 'block chars non-whitespace':
                    regex += '\\S';
                    break;
            }
        }
    }

    if (regex === '') {
        document.getElementById('final-regex').innerHTML = '<span id="final-placeholder">Regex goes here</span>';
    } else {
        document.getElementById('final-regex').innerText = regex;
    }

    updateRegexTest();
}

function escapeString(str) {
    return str.replace(/[\.*+?^=!:${}()|\[\]\/\\]/g, "\\$&");
}

let draggableItems = document.querySelectorAll('.block');
let boxes = document.querySelectorAll('.box');

draggableItems.forEach(item => {
    item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', event.target.innerHTML);
        setTimeout(() => {
            item.classList.add('dragging');
        }, 0);
    });

    item.addEventListener('dragend', (event) => {
        item.classList.remove('dragging');
        generateRegex();  // Call generateRegex after a block is dropped
        regeneratePallet();
    });
});

boxes.forEach(box => {
    box.addEventListener('dragover', (event) => {
        event.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(box, event.clientX); // Use clientX for horizontal movement
        if (afterElement == null) {
            box.appendChild(dragging);
        } else {
            box.insertBefore(dragging, afterElement);
        }
    });

    box.addEventListener('drop', (event) => {
        event.preventDefault();
    });
});

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.block:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2; // Calculate offset horizontally
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function regeneratePallet() {
    const blocks = [
        { type: 'anchor', class: 'str-start', input: null, content: 'str start' },
        { type: 'anchor', class: 'str-end', input: null, content: 'str end' },
        { type: 'boundary', class: 'word', input: null, content: 'word bound' },
        { type: 'literal', class: 'string', input: 'cat', content: null },
        { type: 'chars', class: 'any', input: null, content: 'any char' },
        { type: 'chars', class: 'digit', input: null, content: 'digit' },
        { type: 'chars', class: 'non-digit', input: null, content: 'non-digit' },
        { type: 'chars', class: 'whitespace', input: null, content: 'whitespace' },
        { type: 'chars', class: 'non-whitespace', input: null, content: 'non-whitespace' },
        { type: 'repeat', class: 'zero-plus', input: 'cat', content: '0+ times' },
        { type: 'repeat', class: 'one-plus', input: 'cat', content: '1+ times' },
        { type: 'repeat', class: 'zero-or-one', input: 'cat', content: '0-1 times' }
    ];

    const pallet = document.getElementById('pallet');
    pallet.innerHTML = ''; // Clear current pallet

    // Group the blocks by type for heading generation
    const blockGroups = {
        anchor: [],
        boundary: [],
        literal: [],
        chars: [],
        repeat: []
    };

    const headingNames = {
        'anchor': 'Anchors',
        'boundary': 'Boundaries',
        'literal': 'Literals',
        'chars': 'Character Classes',
        'repeat': 'Quantifiers'
    }

    // Group blocks into their respective categories
    blocks.forEach(block => {
        if (blockGroups[block.type]) {
            blockGroups[block.type].push(block);
        }
    });

    // Function to create the block content elements
    function createBlockElement(block) {
        const blockDiv = document.createElement('div');

        // Ensure the 'type' and 'class' are not empty or null
        const blockType = block.type || 'default';
        const blockClass = block.class || 'default-class';

        blockDiv.classList.add('block', blockType, blockClass);
        blockDiv.setAttribute('draggable', 'true');

        // Check if the block has content or input
        let blockContent;
        if (block.input !== null) {
            // If there is an input field, create an input element
            blockContent = document.createElement('input');
            blockContent.classList.add('block-content');
            blockContent.value = block.input;
            blockDiv.appendChild(blockContent);
        } if (block.content !== null) {
            // Otherwise, create a span element with the content
            blockContent = document.createElement('span');
            blockContent.classList.add('block-content');
            blockContent.textContent = block.content;
            blockDiv.appendChild(blockContent);
        }

        return blockDiv;
    }

    // Add blocks to the pallet under their respective headings
    Object.keys(blockGroups).forEach(group => {
        if (blockGroups[group].length > 0) {
            // Create the heading for this group
            const groupHeading = document.createElement('h3');
            groupHeading.textContent = headingNames[group];
            pallet.appendChild(groupHeading);

            // Add each block of this group
            blockGroups[group].forEach(block => {
                const blockElement = createBlockElement(block);
                pallet.appendChild(blockElement);
            });
        }
    });

    attatchBlockEvents();
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function attatchBlockEvents() {
    let inputs = document.querySelectorAll('input.block-content');
    const draggableItems = document.querySelectorAll('.block');
    draggableItems.forEach(item => {
        item.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', event.target.innerHTML);
            setTimeout(() => {
                item.classList.add('dragging');
            }, 0);
        });

        item.addEventListener('dragend', (event) => {
            item.classList.remove('dragging');
            generateRegex();  // Call generateRegex after a block is dropped
            regeneratePallet(); // Regenerate pallet after drag
        });
    });

    inputs.forEach(input => {
        input.addEventListener('input', function () {
            resizeInput(this);
        });
    });

    blocks.addEventListener('input', adjustScrollbar);

    resizeInputs();

    const children = blocks.children;
    for (let child of children) {
        child.addEventListener('contextmenu', (event) => {
            event.preventDefault();  // Prevent the default right-click menu from showing
            child.remove();
            generateRegex();
            adjustScrollbar();
        });
    }
}

function resizeInputs() {
    let inputs = document.querySelectorAll('input.block-content');
    inputs.forEach(input => resizeInput(input));
}

attatchBlockEvents();

function copyToClipboard() {
    const textToCopy = document.getElementById('final-regex').innerText;

    const input = document.createElement('input');
    input.value = textToCopy;

    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);

    const container = document.getElementById('final-container');
    container.style.outline = '2px solid #62c073';
    setTimeout(() => {
        container.style.outline = '0px solid #62c073'; // Reset to default color
    }, 150);
}

regeneratePallet();

const testingInput = document.getElementById('testing-input')
function updateRegexTest() {
    let regex = new RegExp(document.getElementById('final-regex').innerText);
    let str = testingInput.value;
    if (regex.test(str)) {
        testingInput.style.outline = '2px solid #62c073';
    } else if (str.length > 0) {
        testingInput.style.outline = '2px solid #e5484d';
    } else {
        testingInput.style.outline = '0px solid #62c073';
    }
}

testingInput.addEventListener('input', (event) => {
    updateRegexTest();
});