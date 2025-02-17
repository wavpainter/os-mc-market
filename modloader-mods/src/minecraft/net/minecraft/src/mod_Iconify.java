package net.minecraft.src;

import net.minecraft.client.Minecraft;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Paths;
import java.util.*;
import java.util.List;
import java.util.logging.Logger;

import org.lwjgl.BufferUtils;
import org.lwjgl.opengl.GL11;

import javax.imageio.ImageIO;

public class mod_Iconify extends BaseMod {
    private static final int F7 = 65;
    private Minecraft instance = null;
    private Logger logger = null;
    private RenderItem itemRenderer = new RenderItem();

    public static ArrayList<ItemStack> hiddenItems = new ArrayList<ItemStack>();
    static {
        hiddenItems.add(new ItemStack(Block.waterStill));
        hiddenItems.add(new ItemStack(Block.lavaStill));
        hiddenItems.add(new ItemStack(Block.blockBed));
        hiddenItems.add(new ItemStack(Block.tallGrass));
        hiddenItems.add(new ItemStack(Block.deadBush));
        hiddenItems.add(new ItemStack(Block.pistonExtension));
        hiddenItems.add(new ItemStack(Block.pistonMoving));
        hiddenItems.add(new ItemStack(Block.stairDouble));
        hiddenItems.add(new ItemStack(Block.redstoneWire));
        hiddenItems.add(new ItemStack(Block.crops));
        hiddenItems.add(new ItemStack(Block.tilledField));
        hiddenItems.add(new ItemStack(Block.stoneOvenActive));
        hiddenItems.add(new ItemStack(Block.signPost));
        hiddenItems.add(new ItemStack(Block.doorWood));
        hiddenItems.add(new ItemStack(Block.signWall));
        hiddenItems.add(new ItemStack(Block.doorSteel));
        hiddenItems.add(new ItemStack(Block.oreRedstoneGlowing));
        hiddenItems.add(new ItemStack(Block.torchRedstoneIdle));
        hiddenItems.add(new ItemStack(Block.reed));
        hiddenItems.add(new ItemStack(Block.cake));
        hiddenItems.add(new ItemStack(Block.redstoneRepeaterIdle));
        hiddenItems.add(new ItemStack(Block.redstoneRepeaterActive));
        hiddenItems.add(new ItemStack(Block.lockedChest));
    }

    @Override
    public String Version() { return "Iconify v1.1"; }

    @Override
    public void ModsLoaded() {
        // Get Minecraft instance
        instance = ModLoader.getMinecraftInstance();
        logger = ModLoader.getLogger();

        // Register F6 to iconify
        ModLoader.RegisterKey(this,new KeyBinding("Iconify",F7),false);
    }

    private String getSavePath() throws IOException {
        ModLoader.loadConfig();
        String savePath = null;
        if(!ModLoader.props.containsKey("iconifyPath")) {
            savePath = Paths.get(System.getProperty("user.home"),"Iconify").toString();
            ModLoader.props.setProperty("iconifyPath",savePath);
            ModLoader.saveConfig();
            return savePath;
        }else {
            return ModLoader.props.getProperty("iconifyPath");
        }
    }

    @Override
    public void KeyboardEvent(KeyBinding event) {
        try {
            if (Objects.equals(event.keyDescription, "Iconify") && instance.inGameHasFocus && instance != null) {
                logger.info("Running iconify");

                String savePath = getSavePath();

                // Make directory
                File outputDir;
                for(int i = 1; (outputDir = new File(savePath,"items" + i)).exists(); ++i) {
                }

                if(!outputDir.mkdirs()) {
                    logger.severe("Couldn't create dirs for iconify");
                    return;
                }

                logger.info("Output dir: " + outputDir.toString());

                // Get item list
                ArrayList<ItemStack> items = itemList();
                logger.info("Iterating through " + items.size() + " items");

                // Get viewport size and GUI scale
                int displayWidth = instance.displayWidth;
                int displayHeight = instance.displayHeight;

                // Get scale
                ScaledResolution sr = new ScaledResolution(instance.gameSettings, displayWidth, displayHeight);
                int scale = sr.scaleFactor;
                int imglen = 16 * scale;

                // Enable lighting
                GL11.glColor4f(1.0F, 1.0F, 1.0F, 1.0F);
                GL11.glEnable(2896 /*GL_LIGHTING*/);
                GL11.glEnable(2929 /*GL_DEPTH_TEST*/);

                // Enable item lighting
                GL11.glEnable(32826 /*GL_RESCALE_NORMAL_EXT*/);
                GL11.glPushMatrix();
                GL11.glRotatef(120F, 1.0F, 0.0F, 0.0F);
                RenderHelper.enableStandardItemLighting();
                GL11.glPopMatrix();

                // Set pixel storage format
                GL11.glPixelStorei(3333 /*GL_PACK_ALIGNMENT*/, 1);
                GL11.glPixelStorei(3317 /*GL_UNPACK_ALIGNMENT*/, 1);

                // Create buffer
                int RGBABufferSize = imglen*imglen*4;
                ByteBuffer buffer = BufferUtils.createByteBuffer(RGBABufferSize);
                byte[] pixelData = new byte[RGBABufferSize];
                int[] imageData = new int[imglen*imglen];

                // Draw all items
                for (ItemStack item : items) {
                    GL11.glClearColor(0,0,0,0);
                    GL11.glClear(GL11.GL_COLOR_BUFFER_BIT | GL11.GL_DEPTH_BUFFER_BIT | GL11.GL_STENCIL_BUFFER_BIT | GL11.GL_ACCUM_BUFFER_BIT);
                    //Display.swapBuffers();

                    itemRenderer.renderItemIntoGUI(instance.fontRenderer, instance.renderEngine, item, 0, 0);

                    buffer.clear();
                    GL11.glReadPixels(0,displayHeight - imglen,imglen,imglen,GL11.GL_RGBA,GL11.GL_UNSIGNED_BYTE,buffer);
                    buffer.clear();
                    buffer.get(pixelData);
                    buffer.clear();
                    buffer.put(new byte[RGBABufferSize]);
                    buffer.clear();

                    for(int x = 0; x < imglen; x++) {
                        for(int y = 0; y < imglen; y++) {
                            int offset = x + (imglen - y - 1) * imglen;
                            int r = pixelData[offset * 4 + 0] & 255;
                            int g = pixelData[offset * 4 + 1] & 255;
                            int b = pixelData[offset * 4 + 2] & 255;
                            int a = pixelData[offset * 4 + 3] & 255;

                            int pixel = a << 24 | r << 16 | g << 8 | b;
                            imageData[x + y * imglen] = pixel;
                        }
                    }

                    String itemID = item.getHasSubtypes() ? item.itemID + "_" + item.getItemDamage() : item.itemID + "";
                    File outputFile = new File(outputDir,itemID + ".png");

                    BufferedImage img = new BufferedImage(imglen,imglen, BufferedImage.TYPE_INT_ARGB);
                    img.setRGB(0,0,imglen,imglen,imageData,0,imglen);
                    ImageIO.write(img,"png",outputFile);
                }

                logger.info("Saved icons to " + outputDir.getName());
            }
        } catch (Exception e) {
            logger.severe("Error running iconify: " + e.getMessage());
        }
    }

    //Returns the list of all blocks and items (that I can find)
    public static ArrayList<ItemStack> itemList() {
        ArrayList<ItemStack> allItems = new ArrayList<ItemStack>();

        Item[] mcItemsList = Item.itemsList;
        for(int j = 0; j < mcItemsList.length; j++)
        {
            Item item = mcItemsList[j];
            if(item == null)
            {
                continue;
            }
            HashSet<String> currentItemNames = new HashSet<String>();
            for(int dmg = 0;; dmg++)
            {
                ItemStack itemstack = new ItemStack(item, 1, dmg);
                for(ItemStack hiddenItem : hiddenItems) {
                    if(itemstack.isItemEqual(hiddenItem)) {
                        itemstack = hiddenItem;
                        break;
                    }
                }
                try
                {
                    int l = item.getIconIndex(itemstack);
                    String s = (new StringBuilder()).append(StringTranslate.getInstance().translateNamedKey(itemstack.getItemName())).toString();
                    if(s.length() == 0) s = (new StringBuilder()).append(itemstack.getItemName()).append("@").append(l).toString();
                    if(dmg >= 4 && (s.contains(String.valueOf(dmg)) || s.contains(String.valueOf(dmg + 1)) || s.contains(String.valueOf(dmg - 1)))){
                        break;
                    }
                    s = (new StringBuilder(s)).append("@").append(l).toString();
                    //System.out.println(s);
                    if(!currentItemNames.contains(s))
                    {
                        allItems.add(itemstack);
                        currentItemNames.add(s);
                        continue;
                    }
                    else {
                        break;
                    }
                }
                catch(NullPointerException nullpointerexception) { }
                catch(IndexOutOfBoundsException indexoutofboundsexception) { }
                break;
            }
        }

        List recipes = CraftingManager.getInstance().getRecipeList();
        recipeLoop : for(Iterator iterator = recipes.iterator(); iterator.hasNext();)
        {
            IRecipe irecipe = (IRecipe)iterator.next();
            if(irecipe != null && irecipe.getRecipeOutput() != null && irecipe.getRecipeOutput().getItem() != null) {
                ItemStack itemstack = new ItemStack(irecipe.getRecipeOutput().getItem(), 1, irecipe.getRecipeOutput().getItemDamage());
                for(ItemStack hiddenItem : hiddenItems) {
                    if(itemstack.isItemEqual(hiddenItem)) {
                        itemstack = hiddenItem;
                        break;
                    }
                }
                if(!itemstack.getHasSubtypes()) {
                    continue recipeLoop;
                }

                allItems.add(itemstack);
            }
        }

        return allItems;
    }
}
