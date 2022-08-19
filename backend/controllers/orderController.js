const Order = require('../models/order');
const Product = require('../models/product');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

//create a new Order => /api/v1/order/new
const newOrder = catchAsyncErrors( async (req, res, next)=> {
    const {
        orderItems,
        shippingInfo,
        itemPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo

    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

    res.status(200).json({
        success: true,
        order
    })


})

//Get single Order => /api/v1/order/:id
const getSingleOrder = catchAsyncErrors( async(req, res, next)=> {
    const order = await Order.findById(req.params.id).populate('user', 'name email')

    if(!order) {
        return next(new ErrorHandler('No Order found with this ID', 404))
    }

    res.status(200).json({
        success: true,
        order
    })

})


//Get logged in user's Order => /api/v1/order/me
const myOrders = catchAsyncErrors( async(req, res, next)=> {
    const orders = await Order.find({ user: req.user.id })


    res.status(200).json({
        success: true,
        orders
    })
    
})

//Admin Routes

// Get all Orders - Admin => /api/v1/admin/orders/
const allOrders = catchAsyncErrors( async(req, res, next)=> {
    const orders = await Order.find()

    let totalAmount = 0;

    orders.forEach(order => {
        totalAmount += order.totalPrice

    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })

})

//update / Process Order - ADMIN => /api/v1/admin/order/:id
const updateOrder = catchAsyncErrors( async (req, res, next)=> {
    const order = await Order.findById(req.params.id)

    if(order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('You have already delivered this order', 400))
    }

    order.orderItems.forEach(async item => {
        await updateStock(item.product, item.quantity)

    })

    order.orderStatus = req.body.status,
        order.deliveredAt = Date.now()

    await order.save()

    res.status(200).json({
        success: true,
    })

})

async function updateStock(id, quantity) {
    const product = await Product.findById(id)

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false })


}

//Delete Order => /api/v1/admin/order/:id
const deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id)

    if(!order) {
        return next(new ErrorHandler('No Order Found with this ID', 404))
    }

    await order.remove()

    res.status(200).json({
        success: true
    })


})


module.exports = {
    newOrder,
    getSingleOrder,
    myOrders,
    allOrders,
    updateOrder,
    deleteOrder

}