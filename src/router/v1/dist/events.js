"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.EventsRouter = void 0;
var authorization_1 = require("../middleware/authorization");
var userHasWedding_1 = require("../middleware/userHasWedding");
var basicrouter_1 = require("../basicrouter");
var model_1 = require("../../model");
var error_1 = require("../../error");
var validationrules_1 = require("../middleware/validationrules");
var EmailValidator = require("email-validator");
var EventMiddleware = basicrouter_1.BasicRouter.requireKeysOfTypes({
    name: validationrules_1.isString,
    date: validationrules_1.isDate,
    duration: validationrules_1.isNumber,
    'color?': validationrules_1.isString,
    participants: validationrules_1.parallelValidateBlock([validationrules_1.isArray, function (vaule) {
            return vaule.every(function (item) {
                return EmailValidator.validate(item.email);
            }) || 'Invalid Participants';
        }])
});
var EventsRouter = /** @class */ (function (_super) {
    __extends(EventsRouter, _super);
    function EventsRouter() {
        var _this = _super.call(this) || this;
        _this.getInternalRouter().get('/events', authorization_1.isAuthorized, userHasWedding_1.hasWedding, EventsRouter.getEvents);
        _this.getInternalRouter().get('/events/:event_id', authorization_1.isAuthorized, userHasWedding_1.hasWedding, basicrouter_1.BasicRouter.populateModel(model_1.Events, 'event_id'), EventsRouter.getEvent);
        _this.getInternalRouter().post('/events', authorization_1.isAuthorized, userHasWedding_1.hasWedding, EventMiddleware, EventsRouter.newEvent);
        _this.getInternalRouter().put('/events/:event_id', authorization_1.isAuthorized, userHasWedding_1.hasWedding, EventMiddleware, basicrouter_1.BasicRouter.populateModel(model_1.Events, 'event_id'), EventsRouter.updateEvent);
        _this.getInternalRouter()["delete"]('/events/:event_id', authorization_1.isAuthorized, userHasWedding_1.hasWedding, basicrouter_1.BasicRouter.populateModel(model_1.Events, 'event_id'), EventsRouter.deleteEvent);
        return _this;
    }
    EventsRouter.getEvents = function (req, res, next) {
        req.currentWedding.getEvents().then(function (result) {
            res.jsonContent(result);
        })["catch"](next);
    };
    EventsRouter.getEvent = function (req, res, next) {
        res.jsonContent(req.currentModel);
    };
    EventsRouter.newEvent = function (req, res, next) {
        req.sequelize.transaction(function (t) {
            return req.currentWedding.createEvent(req.body).then(function (event) {
                return Promise.all(req.body.participants.map(function (participant) {
                    return event.createParticipant({ email: participant.email, status: 'pending' });
                })).then(function () {
                    return event;
                });
            });
        }).then(function (event) {
            event.reload().then(function (reload) {
                res.jsonContent(reload);
            });
        })["catch"](next);
    };
    EventsRouter.updateEvent = function (req, res, next) {
        if (req.currentModel.wedding_id === req.currentWedding.id) {
            req.currentModel.update(req.body).then(function (event) {
                var deletions = req.currentModel.participants.map(function (participant) {
                    var stillExisting = req.body.participants.find(function (_a) {
                        var email = _a.email;
                        return email.toLowerCase() === participant.email.toLowerCase();
                    }) != undefined;
                    if (!stillExisting) {
                        return participant.destroy();
                    }
                    return Promise.resolve();
                });
                var additions = req.body.participants.map(function (participant) {
                    var isNew = req.currentModel.participants.find(function (_a) {
                        var email = _a.email;
                        return email.toLowerCase() === participant.email.toLowerCase();
                    }) == undefined;
                    if (isNew) {
                        return event.createParticipant({ email: participant.email, status: 'pending' }).then(function () {
                            return; // turn the promise into a void promise to not confuse TS
                        });
                    }
                    return Promise.resolve();
                });
                return Promise.all(__spreadArrays(deletions, additions)).then(function () {
                    return event;
                });
            }).then(function (event) {
                return event.reload().then(function (reload) {
                    res.jsonContent(reload);
                });
            })["catch"](next);
        }
        else {
            next(new error_1.NotAccessibleError());
        }
    };
    EventsRouter.deleteEvent = function (req, res, next) {
        if (req.currentModel.wedding_id === req.currentWedding.id) {
            req.currentModel.destroy().then(function (result) {
                res.jsonContent({ 'message': 'Event successfully deleted' });
            })["catch"](next);
        }
        else {
            next(new error_1.NotAccessibleError());
        }
    };
    return EventsRouter;
}(basicrouter_1.BasicRouter));
exports.EventsRouter = EventsRouter;
