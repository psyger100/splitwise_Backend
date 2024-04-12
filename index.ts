import app from "./src/app";
import "dotenv/config";

let server: any;

const Serverconfig = {
    port: process.env.PORT || 8000,
};

server = app.listen(Serverconfig.port, () => {
    console.log(`server listening at ${Serverconfig.port}`);
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            console.info("Server closed");
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error: any) => {
    console.error(error);
    exitHandler();
};
