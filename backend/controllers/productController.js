const Product = require('../models/product')

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const APIFeatures = require('../utils/apiFeatures');



// create new product => /api/v1/admin/product/new
const newProduct = catchAsyncErrors(async (req, res, next) => {

    req.body.user = req.user.id;

    const product = await Product.create(req.body)

    res.status(201).json({
        success: true,
        product,

    })

})

// get all products => /api/v1/products?keyword=apple
const getproducts = catchAsyncErrors(async (req, res, next) => {

    const resPerPage = 8;
    const productsCount = await Product.countDocuments();

    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagination(resPerPage)
        
        
        const products = await apiFeatures.query;

    
        res.status(200).json({
            success: true, 
            productsCount,
            resPerPage,
            products
    
        })
    
    
})


//get single Product details =>  /api/v1/product/:id
const getSingleProduct = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));

    }

    res.status(200).json({
        success: true,
        product

    })


})

//update Product => /api/v1/admin/product/:id
const updateProduct = catchAsyncErrors(async (req, res, next) => {

    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        product
    })


})

// Delete Product => /api/v1/admin/product/:id
const deleteProduct = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    await product.remove();

    res.status(200).json({
        success: true,
        message: "Product is deleted"
    })

})


//---------------------------------------------------
    //REVIEW 

//create new review & Update Review => /api/v1/review
const createProductReview = catchAsyncErrors( async (req, res, next)=> {

    const { rating, comment, productId } = req.body;

    //review object we want to add to the database (gotten from current user)
    const review = {
        user: req.user.id,
        name: req.user.name,
        rating: Number(rating),
        comment

    }

    const product = await Product.findById(productId);

    //check if current user has reviewed this product
    const isReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()

    )

    //if current user already has a review for this product, we update the review
    if(isReviewed) {  
        product.reviews.forEach(review => {
            if(review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }

        })

    //Else we push the new review into the reviews Array 
    // and
    //update the number of reviews
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length

    }

    //Calculate the overall Ratings for a Product
    /*
        Reduce method accept multiple values and gives back one value as the end result 
            
        inside product.reviews Array:
            it takes in two parameters 
                accumulator & Item 
                    for each item.rating
                        Add the accumulator and pass in 0

                        we add all the ratings then divide that with product.reviews.length

            summary: 
                we will add all the ratings
                then divide all the rating by the reviews length

            Reduce() basically reduced all multiple values into one single value which is our result 
    */

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    })


})

//Get Product Reviews => /api/v1/reviews
const getProductReviews = catchAsyncErrors( async (req, res, next)=> {
  
    const product = await Product.findById(req.query.id);


    res.status(200).json({
        success:true,
        reviews : product.reviews
    })

})


//Delete Product Reviews => /api/v1/reviews
/*using - 
    ID of the product 
    ID of the Review
*/
const deleteReview = catchAsyncErrors( async (req, res, next)=> {
  
    const product = await Product.findById(req.query.productId);

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

    const numOfReviews = reviews.length;

    const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify : false
    })

    res.status(200).json({
        success: true,

    })


})




module.exports = {
    newProduct,         
    getproducts,        
    getSingleProduct,   
    updateProduct,
    deleteProduct,      
    
    createProductReview,
    getProductReviews,
    deleteReview
}

//configure all logic for our Product Routes 
