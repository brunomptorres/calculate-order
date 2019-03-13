/**
 * CalculateOrder.js - Calculates the price amount of an order given a catalog and pairs of Products and Quantities.
 * 
 * Requires Node.js on your machine. 
 * Developed and tested on Node.js v10.13.0.
 * You can use nvm (macOS/Linux) or nvm-windows to easily switch Node versions between different projects.
 * 
 * Usage: node CalculateOrder Path_to_catalog Product1 Quantity_P1 <Product2 Quantity_P2> ...
 * 
 * @author Bruno Torres <brunomptorres@gmail.com>
 * November 6th, 2018
 */

const fs = require('fs');

const PROMPT_USAGE = 'Usage: CalculateOrder Path_to_catalog Product1 Quantity_P1 <Product2 Quantity_P2> ...',
    INSUFICIENT_ARGUMENTS_ERROR = `Insuficient arguments.\n${PROMPT_USAGE}`,
    INCORRECT_COMMAND_FORMAT_ERROR = `Incorrect command format.\n${PROMPT_USAGE}`,
    NO_FILE_ERROR = 'Catalog file doesn\'t exist.',
    EMPTY_FILE_ERROR = 'Catalog file is empty.',
    INVALID_DATASET_ON_FILE_ERROR = 'Catalog file incorrectly formatted.\nUsage: <ProductID>,<Stock>,<Price>',
    INSUFICIENT_STOCK_ERROR = 'Insufficient stock of item',
    MIN_PROMPT_ARGS = 5,
    CORRECT_AMOUNT_FILE_LINE_ARGS = 3,
    VAT_MULTIPLIER = 1.23;

let catalog = {},
    order = {},
    productList = [];

const exitOnError = err => {
    process.stdout.write(`Error: ${err}\n`);
    process.exit(1);
};

const isInt = n => {
    return !isNaN(n) && (n.indexOf('.') < 0 || parseInt(n.split('.')[1]) === 0);
};

const isFloat = n => {
    return !isNaN(n) && n.indexOf('.') >= 0;
};

const getCatalog = async () => {
    productList.forEach(product => {
        if (product.length > 0) {
            const productInfo = product.split(',');

            if (productInfo.length === CORRECT_AMOUNT_FILE_LINE_ARGS) {
                const productName = productInfo[0].toUpperCase();

                if (isInt(productInfo[1]) && isFloat(productInfo[2])) {
                    const productStock = parseInt(productInfo[1]);
                    const productPrice = parseFloat(productInfo[2]);

                    // Creates a new product entry in the catalog if it doesn't exist yet.
                    // Otherwise adds stock quantity to the pre-existing entry stock.
                    if (catalog[productName] === undefined || catalog[productName] === null) {
                        catalog[productName] = {
                            stock: productStock,
                            price: productPrice
                        };
                    } else {
                        catalog[productName].stock += productStock;
                    }
                } else {
                    throw INVALID_DATASET_ON_FILE_ERROR;
                }
            } else {
                throw INVALID_DATASET_ON_FILE_ERROR;
            }
        } else {
            throw EMPTY_FILE_ERROR;
        }
    });

    return catalog;
};

try {
    if (process.argv.length >= MIN_PROMPT_ARGS) {
        if (fs.existsSync(process.argv[2])) {
            productList = fs.readFileSync(process.argv[2], 'utf8').split(/\r\n|\r|\n/g);
            const orderItems = process.argv.slice(3);

            if (orderItems.length % 2 === 0) {
                let currentOrderItem = '';
                orderItems.forEach((orderItem, index) => {
                    if (index % 2 === 0) {
                        const orderItemName = orderItem.toUpperCase();
                        if (order[orderItemName] === undefined || order[orderItemName] === null) {
                            order[orderItemName] = 0;
                        }
                        currentOrderItem = orderItemName;
                    } else {
                        if (isInt(orderItem)) {
                            const orderItemQuantity = parseInt(orderItem);
                            order[currentOrderItem] += orderItemQuantity;
                        } else {
                            throw INCORRECT_COMMAND_FORMAT_ERROR;
                        }
                    }
                });
            } else {
                throw INSUFICIENT_ARGUMENTS_ERROR;
            }

            getCatalog()
                .then(catalog => {
                    let totalAmount = 0,
                        orderProductsProcessed = 0;

                    Object.keys(order).forEach(productName => {
                        if (catalog[productName] && catalog[productName].stock >= order[productName]) {
                            totalAmount += order[productName] * catalog[productName].price * VAT_MULTIPLIER;
                        } else {
                            throw `${INSUFICIENT_STOCK_ERROR} ${productName}.`;
                        }

                        if (orderProductsProcessed === Object.keys(order).length - 1) {
                            process.stdout.write(`${totalAmount.toFixed(2)}\n`);
                        } else {
                            orderProductsProcessed++;
                        }
                    });
                })
                .catch(err => {
                    exitOnError(err);
                });
        } else {
            throw NO_FILE_ERROR;
        }
    } else {
        throw INSUFICIENT_ARGUMENTS_ERROR;
    }
} catch (err) {
    exitOnError(err);
}