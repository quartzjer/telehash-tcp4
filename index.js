var net = require('net');
var os = require('os');
var lob = require('lob-enc');
var upnp = require('nat-upnp');
var pmp = require('pmp');

exports.name = 'tcp4';
exports.port = 0;
exports.ip = '0.0.0.0';

// add our transport to this new mesh
exports.mesh = function(mesh, cbExt)
{
  var args = mesh.args||{};
  var telehash = mesh.lib;

  var tp = {pipes:{}};

  

  // create the udp socket
  tp.server = net.createServer(function connect(c){
//    tp.pipe(false, {type:'tcp4',ip:rinfo.address,port:rinfo.port}, function(pipe){
//      mesh.receive(packet, pipe);
//    });
  });

  tp.server.on('error', function(err){
    telehash.log.error('tcp4 socket fatal error',err);
  });

  // turn a path into a pipe
  /*
  tp.pipe = function(link, path, cbPipe){
    if(typeof path != 'object' || path.type != 'tcp4') return false;
    if(typeof path.ip != 'string' || typeof path.port != 'number') return false;
    var id = [path.ip,path.port].join(':');
    var pipe = tp.pipes[id];
    if(pipe) return cbPipe(pipe);
    pipe = new telehash.Pipe('tcp4',exports.keepalive);
    tp.pipes[id] = pipe;
    pipe.id = id;
    pipe.path = path;
    pipe.onSend = function(packet, link, cb){
      var buf = lob.encode(packet);
      tp.server.send(buf, 0, buf.length, path.port, path.ip, cb);
    }
    cbPipe(pipe);
  };
*/
  // return our current addressible paths
  tp.paths = function(){
    var ifaces = os.networkInterfaces()
    var address = tp.server.address();
    var paths = [];
    var localhost;
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details){
        if(details.family != 'IPv4') return;
        if(details.address == mesh.public.ipv4) return; // don't duplicate
        var path = {type:'tcp4',ip:details.address,port:address.port};
        if(details.internal) localhost = path;
        else paths.push(path);
      });
    }
    // use localhost path only if no others exist
    if(paths.length == 0 && localhost) paths.push(localhost);
    // add in any nat mapping
    if(tp.nat) paths.push({type:'tcp4',ip:tp.nat.ip,port:tp.nat.port});
    // if public, add it too
    if(mesh.public.ipv4) paths.push({type:'tcp4',ip:mesh.public.ipv4,port:address.port});
    return paths;
  };

  // use config options or bind any/all
  tp.server.listen(args.port?args.port:exports.port, args.ip||exports.ip, function(err){
    if(err) telehash.log.error('tcp4 listen error',err);
    // TODO start pmp and upnp w/ our port
    cbExt(undefined, tp);
  });

}

