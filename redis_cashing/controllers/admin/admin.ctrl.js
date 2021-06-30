const models = require('../../models');
const redis = require('redis');
const redisClient = redis.createClient(); 
const { promisify } = require("util");

redisClient.on('error', function (err) {
    console.log('Error ' + err);
});

const getAsync = promisify(redisClient.get).bind(redisClient);

exports.get_products = async ( _ , res) => {

    let results = JSON.parse(await getAsync("products:all"));

    if(!results){
        results = await models.Products.findAll();
    }
    
    res.render( 'admin/products.html' ,{ products : results });
}

exports.get_products_write = ( _ , res) => {
    res.render( 'admin/write.html');
}

exports.post_products_write = async ( req , res ) => {

    await models.Products.create({
        name : req.body.name,
        price : req.body.price ,
        description : req.body.description
    })

    const products = await models.Products.findAll();
    redisClient.set( "products:all" , JSON.stringify(products))

    res.redirect('/admin/products');

}

exports.get_products_detail = ( req , res ) => {
    models.Products.findByPk(req.params.id).then( (product) => {
        res.render('admin/detail.html', { product: product });  
    });
};

exports.get_products_edit = ( req , res ) => {
    //기존에 폼에 value안에 값을 셋팅하기 위해 만든다.
    models.Products.findByPk(req.params.id).then( (product) => {
        res.render('admin/write.html', { product : product });
    });
};

exports.post_products_edit = ( req , res ) => {

    models.Products.update(
        {
            name : req.body.name,
            price : req.body.price ,
            description : req.body.description
        }, 
        { 
            where : { id: req.params.id } 
        }
    ).then( () => {
        res.redirect('/admin/products/detail/' + req.params.id );
    });

}

exports.get_products_delete = ( req , res ) => {
    models.Products.destroy({
        where: {
            id: req.params.id
        }
    }).then( () => {
        res.redirect('/admin/products');
    });
};

exports.get_login = ( req,res ) => {
    console.log(req.session.user);
    const user = req.session.user ? req.session.user : null;
    res.render('admin/login.html' , { user })
}

exports.post_login = ( req, res ) => {

    const tempUser = {
        id : "junyoung",
        password : "1234"
    }

    if( JSON.stringify(req.body) !== JSON.stringify(tempUser))
        return res.send('<script>alert("not match");history.go(-1)</script>')
    
    // redisClient.set( `user:${req.body.id}` , JSON.stringify(req.body))
    req.session.user = req.body;
    res.redirect('/admin/login')
}