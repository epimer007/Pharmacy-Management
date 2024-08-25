const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const encoder = bodyParser.urlencoded({ extended: true });
const path = require('path');
const session = require('express-session');

app.use(express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(bodyParser.json());


// Set up session middleware
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

const con = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root1",
    database:"drugdatabase"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to database!");
  });

  app.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html");

});

app.get('/login.html', function(req, res) {
    res.sendFile(__dirname + "/login.html");
    
});

app.get("/Register.html",encoder,function(req,res){
    res.sendFile(__dirname + "/Register.html");
    
})

app.get("/SellerRegister.html",encoder,function(req,res){
    res.sendFile(__dirname + "/SellerRegister.html");
    
})



//--------------------------------------------------------------------------


// Seller Registration 
app.post('/register', encoder,(req, res) => {
    const { name, phno, uid, address, pass1 } = req.body;
    const phno2 = parseInt(phno, 10);

    
    const insertUserQuery = 'INSERT INTO seller (sid, pass, sname, address, phno) VALUES (?, ?, ?, ?, ?)';

    
        con.query(insertUserQuery, [uid, pass1, name, address, phno2], (err, results) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/Login.html');
        });
    
});


// User Registration
app.post('/uregister',encoder,(req, res) => {
    const { fname, lname, email, phno, uid, address, pass1, pass2 } = req.body;
    const phno2 = parseInt(phno, 10);

    // Check if phone number is valid
    if (isNaN(phno2)) {
        return res.status(400).send('Invalid phone number');
    }

    
    const insertUserQuery = 'INSERT INTO customer (uid, pass, fname, lname, email, address, phno) VALUES (?, ?, ?, ?, ?, ?, ?)';

    

        // Check if passwords match
        if (pass1 !== pass2) {
            return res.redirect('/RegisterError2.html');
        }

        // Insert new user
        con.query(insertUserQuery, [uid, pass1, fname, lname, email, address, phno2], (err, results) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/Login.html');
        });
    
});


//-----------------------------------------------------------------------



//Login endpoint
app.post('/login',encoder,(req, res) => {
    const { userid, password, utype } = req.body;
    const userType = parseInt(utype, 10);

    if (isNaN(userType)) {
        return res.status(400).send('Invalid user type');
    }

    const querySeller = 'SELECT sid, pass FROM Seller WHERE sid = ?';
    const queryCustomer = 'SELECT uid, pass FROM customer WHERE uid = ?';
    const query = userType === 2 ? querySeller : queryCustomer;

    if (!query) {
        return res.status(400).send('Invalid user type');
    }

    // Start a new session
    req.session.currentuser = userid;

    con.query(query, [userid], (err, results) => {
        if (err) {
            console.error('Error querying user:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0];
            if (user.pass === password) {
                if (userType === 1) {
                    res.redirect('/profile'); // Change to the path where your homepage is located
                } else if (userType === 2) {
                    res.redirect('/home'); // Change to the path where your seller homepage is located
                }
            } else {
                res.redirect('/LoginError1.html');
            }
        } else {
            res.redirect('/LoginError2.html');
        }
    });
});





app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route to display the home page
app.get('/home', (req, res) => {
    const currentUser = req.session.currentuser;

    if (!currentUser) {
        return res.redirect('/login');
    }

    const query = 'SELECT sname, sid, address, phno FROM seller WHERE sid = ?';
    
    con.query(query, [currentUser], (err, results) => {
        if (err) {
            console.error('Error querying user:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0];
            res.render('home', {
                sname: user.sname,
                sid: user.sid,
                address: user.address,
                phno: user.phno
            });
        } else {
            res.status(404).send('User not found');
        }
    });
});

// Route to handle logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/login');
    });
});

// Route to handle login (example only, should use a POST method)
app.get('/login', (req, res) => {
    res.render('login');
});




// Route for the USER home page
app.get('/profile', (req, res) => {
    const guid = req.session.currentuser;

    if (!guid) {
        return res.redirect('/login');
    }

    const query = 'SELECT fname, uid, address, phno, email FROM customer WHERE uid = ?';
    
    con.query(query, [guid], (err, results) => {
        if (err) {
            console.error('Error querying user:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            const user = results[0];
            res.render('profile', {
                fname: user.fname,
                uid: user.uid,
                address: user.address,
                phno: user.phno,
                email: user.email
            });
        } else {
            res.status(404).send('User not found');
        }
    });
});

// Route for login page (example)
app.get('/login', (req, res) => {
    res.send('Login Page'); // Replace with your login page
});

//login error
app.get("/LoginError1.html",(req,res)=>{
    res.send("<p>Invalid details</p>");
})
app.get("/LoginError2.html",(req,res)=>{
    res.send("<p>Invalid details</p>");
})

//---------------------------------------------------------------------------




//Product endpoint
app.get("/AddProduct.html",(req,res)=>{
    res.sendFile(__dirname+"/AddProduct.html");
})

app.post('/add-product',encoder, (req, res) => {
    const guid = req.session.currentuser; // Current logged-in user ID

    const { prname, prid, mfname, mdate, edate, price, quantity } = req.body;

    const query1 = 'SELECT pid FROM product WHERE pid = ?';
    const query2 = 'INSERT INTO product(pid, pname, manufacturer, mfg, exp, price,quant) VALUES (?, ?, ?, ?, ?, ?,?)';
    const query3 = 'INSERT INTO inventory(pid, pname, sid, quantity) VALUES (?, ?, ?, ?)';

    con.query(query1, [prid], (err, results) => {
        if (err) {
            console.error('Error querying product:', err);
            return res.redirect('/add-product-error2');
        }

        if (results.length === 0) {
            con.query(query2, [prid, prname, mfname, mdate, edate, parseInt(price),quantity], (err, result) => {
                if (err) {
                    console.error('Error inserting product:', err);
                    return res.redirect('/add-product-error2');
                }

                con.query(query3, [prid, prname, guid, parseInt(quantity)], (err, result) => {
                    if (err) {
                        console.error('Error inserting into inventory:', err);
                        return res.redirect('/add-product-error2');
                    }

                    res.redirect('/AddInventory'); // Redirecting to inventory page after successful addition
                });
            });
        } else {
            res.redirect('/add-product-error'); // Product already exists
        }
    });
});


//---------------------------------------------------------------------------

//Addinventory endpoint
app.get('/AddInventory', (req, res) => {
    const guid = req.session.currentuser;

    const query = `
        SELECT p.pid, i.quantity, p.pname, p.manufacturer, p.mfg, p.exp, p.price
        FROM product p
        JOIN inventory i ON p.pid = i.pid
        WHERE i.sid = ?
    `;

    con.query(query, [guid], (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Server error');
        }

        res.render('AddInventory', { products: results });
    });
});


//Updating inventory
app.post('/update-inventory', (req, res) => {
    const { pid, restock } = req.body;

    const updateQuery = 'UPDATE inventory SET quantity = quantity + ? WHERE pid = ?';

    con.query(updateQuery, [parseInt(restock), pid], (err, result) => {
        if (err) {
            console.error('Error updating inventory:', err);
            return res.redirect('/restock-error');
        }

        res.redirect('/AddInventory');
    });
});



//-------------------------------------------------------------------------------

// Route to display orders to Sellers
app.get('/SellerOrders', (req, res) => {
    const sellerId = req.session.currentuser;

    if (!sellerId) {
        return res.redirect('/login');
    }

    const query = `
        SELECT o.oid, o.pid, o.price, o.quantity, o.uid
        FROM orders o
        INNER JOIN inventory i ON o.pid = i.pid
        WHERE i.sid = ?
    `;

    con.query(query, [sellerId], (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).send('Server error');
        }

        res.render('SellerOrders', {
            orders: results
        });
    });
});





//------------------------------------------------------------------------------



// Customers endpoint to display available products for buying
app.get('/Buy', (req, res) => {
    const query = `SELECT p.pname, p.pid, p.manufacturer, p.mfg, p.price, i.quantity FROM product p, inventory i WHERE p.pid = i.pid`;

    con.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Server error');
        }

        res.render('buy', { products: results });
    });
});



//------------------------------------------------------------------------------



// Route to handle placing an order
app.post('/PlaceOrder', encoder,(req, res) => {
    const pid = req.body.pid;
    const orderquantity = parseInt(req.body.orderquantity);
    const guid = req.session.currentuser;  // Assuming user session is set up

    const query1 = 'SELECT p.pid, o.sid, p.price FROM inventory o, product p WHERE p.pid = ? AND p.pid = o.pid';
    const query2 = 'INSERT INTO orders (pid, sid, uid, quantity, price) VALUES (?, ?, ?, ?, ?)';

    con.query(query1, [pid], (err, result) => {
        if (err) {
            console.error('Error executing query1: ', err);
            return res.status(500).send('An error occurred');
        }
        

        if (result.length > 0) {
            const { pid, sid, price } = result[0];
            const totalPrice = orderquantity * price;

            con.query(query2, [pid, sid, guid, orderquantity, totalPrice], (err2, result2) => {
                if (err2) {
                    console.error('Error executing query2: ', err2);
                    return res.status(500).send('An error occurred');
                }

                // Redirect to orders page after successful order placement
                res.redirect('/orders');
            });
        } else {
            res.status(404).send('Product not found');
        }
    });
});



//-----------------------------------------------------------------------------------


// Route to display orders
app.get('/Orders', (req, res) => {
    const gid = req.session.currentuser;  // Assuming session is set up

    if (!gid) {
        return res.status(401).send('Unauthorized: No session found');
    }

    const query = `
        SELECT o.oid, o.pid, o.quantity, o.price, o.sid
        FROM orders o
        WHERE o.uid = ?`;

    con.query(query, [gid], (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            return res.status(500).send('An error occurred while fetching orders');
        }

        // Pass orders to EJS template
        res.render('Orders', { orders: results });
    });
});




//---------------------------------------------------------------------------



//Update Inventory endpoint
app.post('/UpdateInventory', encoder,(req, res) => {
    const quantity = parseInt(req.body.restock);
    const productId = req.body.pid;
    const sellerId = req.session.currentuser;

    if (!sellerId) {
        return res.redirect('/login.html');
    }

    const query = 'UPDATE inventory SET quantity = quantity + ? WHERE sid = ? AND pid = ?';

    con.query(query, [quantity, sellerId, productId], (err, result) => {
        if (err) {
            console.error('Error updating inventory:', err);
            return res.status(500).send('Server error');
        }

        res.redirect('/AddInventory');
    });
});


app.listen(4000);