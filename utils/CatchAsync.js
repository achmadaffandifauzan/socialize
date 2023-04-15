// accept function(x) then return a function that run (return) a function(x).catch 
module.exports = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}