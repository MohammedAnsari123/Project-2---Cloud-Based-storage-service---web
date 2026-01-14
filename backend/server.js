const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config();

const userRoutes = require('./routes/user.Route')
const folderRoutes = require('./routes/folder.Route')
const filesRoutes = require('./routes/file.Route')
const shareRoutes = require('./routes/share.Route')
const searchRoutes = require('./routes/search.Route')
const starRoutes = require('./routes/star.Route')
const trashRoutes = require('./routes/trash.Route')
const downloadRoutes = require('./routes/download.Route')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/user', userRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stars', starRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/download', downloadRoutes);

app.listen(process.env.PORT, () => console.log("Server Running on Port " + process.env.PORT));
