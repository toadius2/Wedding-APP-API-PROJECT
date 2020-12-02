import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ModelRouteRequest } from "../basicrouter";
import { InvalidParametersError, NotAccessibleError } from "../../error";
import { isString, isEnum } from "../middleware/validationrules";
import * as multer from "multer"
import { Invoice, InvoiceAttributes, InvoiceInstance } from "../../model/invoice";
import * as nconf from 'nconf'
import * as uuid from "uuid";
import { S3 } from "aws-sdk";
import * as fs from 'fs'

const bucket_url = nconf.get("BUCKET_URL");


export class InvoiceRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/invoices', isAuthorized, hasWedding, InvoiceRouter.getInvoices);
        this.getInternalRouter().get('/invoices/:id', isAuthorized, hasWedding, BasicRouter.populateModel(Invoice, 'id'), InvoiceRouter.getInvoice);
        this.getInternalRouter().post('/invoices', isAuthorized, hasWedding, multer({ dest: '.uploads/' }).single('invoice'), BasicRouter.requireKeysOfTypes({
            category: isString,
            'amount?': isString,
            'paid?': isEnum(['false', 'true'])
        }), InvoiceRouter.newInvoice);
        this.getInternalRouter().put('/invoices/:id', isAuthorized, hasWedding, multer({ dest: '.uploads/' }).single('invoice'), BasicRouter.requireKeysOfTypes({
            'category?': isString,
            'amount?': isString,
            'paid?': isEnum(['false', 'true'])
        }), BasicRouter.populateModel(Invoice, 'id'), InvoiceRouter.updateInvoice);
        this.getInternalRouter().delete('/invoices/:id', isAuthorized, hasWedding, BasicRouter.populateModel(Invoice, 'id'), InvoiceRouter.deleteInvoice);
    }

    private static getInvoices(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getInvoices().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static getInvoice(req: ModelRouteRequest<InvoiceInstance>, res: APIResponse, next: express.NextFunction) {
        res.jsonContent(req.currentModel);
    }

    private static async newInvoice(req: APIRequest<InvoiceAttributes>, res: APIResponse, next: express.NextFunction) {
        if (req.file) {
            const s3Key = (nconf.get('BUCKET_ENV') || 'development') + '/wedding/' + req.currentWedding!.id + '/invoices/' + uuid.v4() + '_' + req.file.originalname;
            await new S3({
                region: nconf.get('BUCKET_REGION')
            }).putObject({
                Bucket: nconf.get('BUCKET_NAME'),
                Key: s3Key,
                Body: fs.createReadStream(req.file.path),
                ContentType: req.file.mimetype,
            }).promise()
            req.currentWedding!.createInvoice({ ...req.body, invoice_url: bucket_url + '/' + s3Key }).then(invoice => {
                res.jsonContent(invoice);
            }).catch(next);
        } else {
            return next(new InvalidParametersError(["invoice"], {}));
        }
    }

    private static async updateInvoice(req: ModelRouteRequest<InvoiceInstance, InvoiceAttributes>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            if (req.file) {
                const s3Key = (nconf.get('BUCKET_ENV') || 'development') + '/wedding/' + req.currentWedding!.id + '/invoices/' + uuid.v4() + '_' + req.file.originalname;
                await new S3({
                    region: nconf.get('BUCKET_REGION')
                }).putObject({
                    Bucket: nconf.get('BUCKET_NAME'),
                    Key: s3Key,
                    Body: fs.createReadStream(req.file.path),
                    ContentType: req.file.mimetype,
                }).promise()
                req.body.invoice_url = bucket_url + '/' + s3Key
            }
            req.currentModel.update(req.body).then(invoice => {
                res.jsonContent(invoice)
            }).catch(next)
        } else {
            next(new NotAccessibleError())
        }
    }

    private static deleteInvoice(req: ModelRouteRequest<InvoiceInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.destroy().then(result => {
                res.jsonContent({ 'message': 'Event successfully deleted' });
            }).catch(next);
        } else {
            next(new NotAccessibleError())
        }
    }
}
