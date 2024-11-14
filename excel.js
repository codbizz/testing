const readXlsxFile = require('read-excel-file/node')


readXlsxFile('admin test upload template.xlsx', { sheet: 2 }).then((rows) => {
    console.log(rows);
})

