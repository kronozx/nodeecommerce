#Shopping Cart 

##Description   

This is a basic project for an e-commerce shopping cart.

For testing purposes, go to /admin/register route and register an admin to test adding products
to the database (used mongoDB Atlas and Cloudinary).

##Additional features on v7
- Add Git and manage future updates with Git instead of creating new versions.
- Refactor of reset password functionality (with sendgrid) by using async.waterfall


##Further Functionality
Next steps would be:
- Erase images from cloudinary when deleting items
- Integrate the cart with online payment suites.
- Keep in mind when to sanitize (preven script injection) when adding a product.
