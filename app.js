const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
    try{
        const image = await Jimp.read(inputFile);
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        const textData = {
            text,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        };
        image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
        await image.quality(100).writeAsync(outputFile);
        console.log('Watermark added to image!');
        startApp();
    }
    catch {
        console.log('Something went wrong... Try again');
    }
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
    try {
        const image = await Jimp.read(inputFile);
        const watermark = await Jimp.read(watermarkFile);

        const x = image.getWidth()/2 - watermark.getWidth()/2;
        const y = image.getHeight()/2 - watermark.getHeight()/2;

        image.composite(watermark, x, y, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 0.5,
        });

        await image.quality(100).writeAsync(outputFile);
        console.log('Watermark added to image!');
        startApp();
    }
    catch {
        console.log('Something went wrong... Try again');
    }
};

const prepareOutputFilename = fileName => `${fileName.split('.')[0]}-with-watermark.${fileName.split('.')[1]}`;
const prepareEditedFile = (fileName, editOption) => `${fileName.split('.')[0]}-${editOption}.${fileName.split('.')[1]}`;

const startApp = async () => {
    //Ask if user is ready
    const answer = await inquirer.prompt([{
        name: 'start',
        message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
        type: 'confirm',
    }]);

    // if answer is no, just quit the app
    if(!answer.start) process.exit();

    // ask about input file and watermark type
    const options = await inquirer.prompt([{
        name: 'inputImage',
        type: 'input',
        message: 'What file do you want to mark?',
        default: 'test.jpg',
    },
    {
        name: 'watermarkType',
        type: 'list',
        choices: ['Text watermark', 'Image watermark'],
    }
    ]);

    const answerEdit = await inquirer.prompt([{
        name: 'editStart',
        message: 'Do You want to edit selected image?',
        type: 'confirm',
    }]);

    if (answerEdit.editStart) {
        const editImage = await inquirer.prompt([{
            name: 'editMethod',
            type: 'list',
            choices: ['Make image brighter', 'Increase contrast', 'Make image b&w', 'Invert image'],
        }]);
        
        if(fs.existsSync(`./img/${options.inputImage}`)) {
            switch(editImage.editMethod) {
                case 'Make image brighter':
                    const brighter = await inquirer.prompt([{
                        name: 'brighterParam',
                        type: 'number',
                        message: 'Select number between -1 and 1',
                    }]);

                    if (brighter.brighterParam < -1 || brighter.brighterParam > 1) {
                        console.log('Something went wrong... Try again');
                        return startApp();
                    }
                    await (await Jimp.read(`./img/${options.inputImage}`)).brightness(brighter.brighterParam).write(`./img/${prepareEditedFile(options.inputImage,'brighter')}`);
                    options.inputImage = `${prepareEditedFile(options.inputImage,'brighter')}`;
                    break;
                case 'Increase contrast':
                    const contrast = await inquirer.prompt([{
                        name: 'contrastParam',
                        type: 'number',
                        message: 'Select number between -1 and 1',
                    }]);

                    if (contrast.contrastParam < -1 || contrast.contrastParam > 1) {
                        console.log('Something went wrong... Try again');
                        return startApp();
                    }
                    await (await Jimp.read(`./img/${options.inputImage}`)).contrast(contrast.contrastParam).write(`./img/${prepareEditedFile(options.inputImage,'contrast')}`);
                    options.inputImage = `${prepareEditedFile(options.inputImage,'contrast')}`;
                    break;
                default:
                    break;
            }   
        }
    }

    if(options.watermarkType === 'Text watermark') {
        const text = await inquirer.prompt([{
            name: 'value',
            type: 'input',
            message: 'Type your watermark text:',
        }]);
        options.watermarkText = text.value;
        if(fs.existsSync(`./img/${options.inputImage}`)) {
            addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), options.watermarkText);
        } else {
            console.log('Something went wrong... Try again');
        }
    } else {
        const image = await inquirer.prompt([{
            name: 'filename',
            type: 'input',
            message: 'Type your watermark name:',
            default: 'logo.png',
        }]);
        options.watermarkImage = image.filename;
        if(fs.existsSync(`./img/${options.inputImage}`) && fs.existsSync(`./img/${options.watermarkImage}`)) {
            addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage);
        } else {
            console.log('Something went wrong... Try again');
        }
    }
};

startApp();