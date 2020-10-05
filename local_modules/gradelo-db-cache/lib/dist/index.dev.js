"use strict";

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Redis = require("ioredis");

var util = require("util");

var NotFoundError =
/*#__PURE__*/
function (_Error) {
  _inherits(NotFoundError, _Error);

  function NotFoundError() {
    var _this;

    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Ressource not found';

    _classCallCheck(this, NotFoundError);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(NotFoundError).call(this, message));
    Object.setPrototypeOf(_assertThisInitialized(_this), Error.prototype);
    return _this;
  }

  return NotFoundError;
}(_wrapNativeSuper(Error));

exports.NotFoundError = NotFoundError;

var GenericError =
/*#__PURE__*/
function (_Error2) {
  _inherits(GenericError, _Error2);

  function GenericError() {
    var _this2;

    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Generic unhandled Error';

    _classCallCheck(this, GenericError);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(GenericError).call(this, message));
    Object.setPrototypeOf(_assertThisInitialized(_this2), Error.prototype);
    return _this2;
  }

  return GenericError;
}(_wrapNativeSuper(Error));

exports.GenericError = GenericError;
var LogLevel;

(function (LogLevel) {
  LogLevel[LogLevel["NONE"] = 0] = "NONE";
  LogLevel[LogLevel["WARNING"] = 1] = "WARNING";
  LogLevel[LogLevel["INFO"] = 2] = "INFO";
  LogLevel[LogLevel["VERBOSE"] = 3] = "VERBOSE";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));

exports.CACHE_DEFAULT_EXPIRE = 120;

var DBCache =
/*#__PURE__*/
function () {
  function DBCache(options) {
    _classCallCheck(this, DBCache);

    this.options = options;
    this.options.log_level = this.options.log_level || LogLevel.WARNING;
    this.options.ttl = this.options.ttl || exports.CACHE_DEFAULT_EXPIRE;

    this.options.logger = this.options.logger || function (err, message) {
      if (err) {
        console.error(err);
        message && console.error(message);
      } else {
        console.info(message);
      }
    };

    this.startRedisConnection(options.redis_url);
  }
  /**
   * Cache a object in the given room (if given), at the model name and the given uniqueidentifier
   * @param modelinstance
   * @param modelName
   * @param uniqueIdentifier
   */


  _createClass(DBCache, [{
    key: "cacheModel",
    value: function cacheModel(modelinstance, modelName, uniqueIdentifier) {
      this.redisConnection.set(this.keyForObject(modelName, uniqueIdentifier), JSON.stringify(modelinstance), 'EX', this.options.ttl);
      this.log(undefined, JSON.stringify({
        type: 'db-cache-info',
        content: 'DB-CACHE: Object stored for model ' + modelName + ' with id ' + uniqueIdentifier,
        timestamp: new Date()
      }), LogLevel.VERBOSE);
    }
    /**
     * Retrieve cached object. This method will reset the expiration timer.
     * Rejects with NotFoundError if object is not in cache
     * @param modelName the model name
     * @param uniqueIdentifier the identifier
     */

  }, {
    key: "getModel",
    value: function getModel(modelName, uniqueIdentifier) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var key = _this3.keyForObject(modelName, uniqueIdentifier);

        _this3.redisConnection.get(key, function (err, result) {
          if (err || result == undefined) {
            reject(new NotFoundError());

            _this3.log(undefined, JSON.stringify({
              type: 'db-cache-info',
              content: 'DB-CACHE: Object not found for model ' + modelName + ' with id ' + uniqueIdentifier,
              timestamp: new Date()
            }), LogLevel.VERBOSE);
          } else {
            try {
              var obj = JSON.parse(result);
              /*if (this.options.maximum_object_ttl !== undefined) {
                  obj.__db_cache_ttl_resets__ = obj.__db_cache_ttl_resets__ || this.redisConnection.;
                  let total = obj.__db_cache_ttl_resets__ * this.options.ttl!;
                  if (total > (this.options.maximum_object_ttl - this.options.ttl!)) {
                      reject(new NotFoundError());
                      this.log(undefined, JSON.stringify({
                          type: 'db-cache-info',
                          content: 'DB-CACHE: Object expired with maximum ttl ' + this.options.maximum_object_ttl + ' for model ' + modelName + ' with id ' + uniqueIdentifier,
                          timestamp: new Date()
                      }), LogLevel.VERBOSE);
                      return;
                  } else {
                      obj.__db_cache_ttl_resets__ += 1;
                      this.cacheModel(obj, modelName, uniqueIdentifier);
                      delete obj.__db_cache_ttl_resets__;
                  }
                } else {
                  this.redisConnection.expire(key, this.options.ttl!);
              }*/

              resolve(obj);

              _this3.redisConnection.expire(key, _this3.options.ttl);

              _this3.log(undefined, JSON.stringify({
                type: 'db-cache-info',
                content: 'DB-CACHE: Object found for model ' + modelName + ' with id ' + uniqueIdentifier,
                timestamp: new Date()
              }), LogLevel.VERBOSE);
            } catch (e) {
              reject(new GenericError());

              _this3.log(undefined, JSON.stringify({
                type: 'db-cache-error',
                content: 'DB-CACHE: Object found for model ' + modelName + ' with id ' + uniqueIdentifier + ', but error parsing object ' + result,
                timestamp: new Date()
              }), LogLevel.WARNING);
            }
          }
        });
      });
    }
    /**
     * Removes a model from the cache
     * @param modelName
     * @param uniqueidentifier
     */

  }, {
    key: "invalidateModel",
    value: function invalidateModel(modelName, uniqueidentifier) {
      this.redisConnection.del(this.keyForObject(modelName, uniqueidentifier));
    }
  }, {
    key: "keyForObject",
    value: function keyForObject(modelName, uniqueIdentifier) {
      return (this.options.room != undefined ? this.options.room + '/' : '') + modelName + '/' + uniqueIdentifier;
    }
  }, {
    key: "startRedisConnection",
    value: function startRedisConnection(url) {
      var _this4 = this;

      this.redisConnection = new Redis(url, {
        retryStrategy: function retryStrategy(times) {
          if (times < 3) {
            return 200;
          } else {
            if (process.env['NODE_ENV'] === 'development') {
              return false;
            }

            return 10000;
          }
        },
        enableOfflineQueue: false
      });
      this.redisConnection.on('connect', function () {
        _this4.log(undefined, JSON.stringify({
          type: 'db-cache-info',
          content: 'DB-CACHE: Connection Established',
          timestamp: new Date()
        }), LogLevel.INFO);
      });
      this.redisConnection.on('ready', function () {
        _this4.log(undefined, JSON.stringify({
          type: 'db-cache-info',
          content: 'DB-CACHE: Connection Ready',
          timestamp: new Date()
        }), LogLevel.INFO);
      });
      this.redisConnection.on('error', function (error) {
        _this4.log(error, JSON.stringify({
          type: 'db-cache-error',
          content: 'DB-CACHE: ' + util.inspect(error),
          timestamp: new Date()
        }), LogLevel.WARNING);
      });
      this.redisConnection.on('nodeError', function (error) {
        _this4.log(error, JSON.stringify({
          type: 'db-cache-error',
          content: 'DB-CACHE: ' + util.inspect(error),
          timestamp: new Date()
        }), LogLevel.WARNING);
      });
      this.redisConnection.on('reconnecting', function () {
        _this4.log(undefined, JSON.stringify({
          type: 'db-cache-info',
          content: 'DB-CACHE: Reconnecting...',
          timestamp: new Date()
        }), LogLevel.INFO);
      });
    }
  }, {
    key: "log",
    value: function log(err, message, level) {
      if (this.options.log_level >= level) {
        this.options.logger(err, message);
      }
    }
  }]);

  return DBCache;
}();

exports["default"] = DBCache;