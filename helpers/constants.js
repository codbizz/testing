exports.constants = {
	admin: {
		name: "admin",
		email: "admin@admin.com"
	},
	confirmEmails: {
		from : "no-reply@test-app.com"
	},
	pointsTransaction:{
		'ADD':1,
		'SUBSTRACT':2,
	},
	pointsTransactionReason:{
		'TEST_ADDONS':'test_addon_points',
		'ORDER_CREATED':'order_created'
	},
	pointsTransactionStatus:{
		PAID:'paid',
		CREATED:'created',
	},
	pointsTransactionComment:{
		'TEST_ADDONS':'points earned form test',
		'ORDER_CREATED':'points debited because of purchase'
	},
	exampleFile:{
		fileAddress:'uploads\\newcsvformat.csv',
		linuxfileAddress:'uploads/newcsvformat.csv'
	},
	imgUrl:{
		local:'http://localhost:3000/',
		test:'http://pmp-mock-test.hackerkernel.co/',
	},
};